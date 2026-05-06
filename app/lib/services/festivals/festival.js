import { revalidateTag } from "next/cache";
import {
  ServiceError,
  parseArrayField,
  validateImageFile,
  getAuthenticatedContext,
  getSupabaseServerClient,
  getSupabaseAdminClient,
} from "../shared";
import { getServerUser } from "@/app/lib/config/supabaseServer";
import {
  processAndUploadImage,
  processAndUploadMapImage,
  deleteImageVariants,
} from "@/app/lib/services/imageProcessing";

function escapeLike(input) {
  return input.replace(/[%_]/g, (m) => `\\${m}`);
}

const normalizeArtistName = (name) => {
  if (!name) return "";
  return name
    .replace(/\s*\([^)]*\)/g, "")
    .trim()
    .toLowerCase();
};

const validateFestivalDates = (startDate, endDate) => {
  if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
    throw new ServiceError("End date must be after start date", 400);
  }
};

export async function getAllFestivals({
  limit = 20,
  offset = 0,
  country = null,
  name = null,
  sort = null,
  userId = null,
} = {}) {
  const admin = getSupabaseAdminClient();

  let query = admin
    .from("festivals")
    .select(
      "id, name, festival_slug, image_url, country, city, location_url, start_date, end_date, description, created_at, rating_stats",
      { count: "exact" },
    )
    .eq("status", "approved");

  if (name) query = query.ilike("name", `%${escapeLike(name)}%`);
  if (country) query = query.eq("country", country);

  if (sort === "name") {
    query = query.order("name", { ascending: true });
  } else if (sort === "newest") {
    query = query.order("created_at", { ascending: false });
  } else if (sort === "oldest") {
    query = query.order("created_at", { ascending: true });
  } else if (sort === "date_asc") {
    query = query.order("start_date", { ascending: true, nulls: "last" });
  } else if (sort === "date_desc") {
    query = query.order("start_date", { ascending: false, nulls: "last" });
  } else {
    query = query.order("name", { ascending: true });
  }

  query = query.range(offset, offset + limit - 1);

  const { data: festivalsPage, count, error } = await query;
  if (error) throw new ServiceError(error.message, 500);

  const festivals = festivalsPage || [];
  const festivalIds = festivals.map((f) => f.id);

  let likesCount = {};
  let userLikedSet = new Set();
  let userRatingsMap = {};

  if (festivalIds.length > 0) {
    const { data: likesData } = await admin
      .from("festival_likes")
      .select("festival_id, user_id")
      .in("festival_id", festivalIds);
    (likesData || []).forEach((l) => {
      likesCount[l.festival_id] = (likesCount[l.festival_id] || 0) + 1;
      if (userId && l.user_id === userId) userLikedSet.add(l.festival_id);
    });

    if (userId) {
      const { data: ratingsData } = await admin
        .from("festival_ratings")
        .select("festival_id, rating")
        .in("festival_id", festivalIds)
        .eq("user_id", userId);
      (ratingsData || []).forEach((r) => {
        userRatingsMap[r.festival_id] = r.rating;
      });
    }
  }

  let festivalsWithLikes = festivals.map((festival) => ({
    ...festival,
    likesCount: likesCount[festival.id] || 0,
    userLiked: userLikedSet.has(festival.id),
    userRating: userRatingsMap[festival.id] || null,
  }));

  if (sort === "most_liked") {
    festivalsWithLikes = festivalsWithLikes.sort(
      (a, b) => (b.likesCount || 0) - (a.likesCount || 0),
    );
  }

  const total = typeof count === "number" ? count : null;
  return {
    data: festivalsWithLikes,
    total,
    limit,
    offset,
    hasMore:
      total !== null
        ? offset + festivalsWithLikes.length < total
        : festivalsWithLikes.length === limit,
  };
}

export async function getFestivalById(slug, cookieStore) {
  if (!slug) throw new ServiceError("Festival slug is required", 400);
  const supabase = await getSupabaseServerClient(cookieStore);

  const isUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      slug,
    );
  const { data: festival, error } = await supabase
    .from("festivals")
    .select("*")
    .eq(isUUID ? "id" : "festival_slug", slug)
    .single();

  if (error || !festival) throw new ServiceError("Festival not found", 404);

  let lineupWithIds = [];
  if (festival.lineup && festival.lineup.length > 0) {
    const { data: allArtistsData } = await supabase
      .from("artists")
      .select("id, name, stage_name, artist_slug");

    if (allArtistsData) {
      const artistMap = new Map();
      allArtistsData.forEach((artist) => {
        const n = normalizeArtistName(artist.name);
        const s = normalizeArtistName(artist.stage_name);
        if (n) artistMap.set(n, artist);
        if (s) artistMap.set(s, artist);
      });

      lineupWithIds = festival.lineup.map((artistName) => {
        const found = artistMap.get(normalizeArtistName(artistName));
        return found
          ? { name: artistName, id: found.id, artist_slug: found.artist_slug }
          : { name: artistName, id: null, artist_slug: null };
      });
    }
  }

  const admin = getSupabaseAdminClient();

  const { count: likesCount } = await admin
    .from("festival_likes")
    .select("*", { count: "exact", head: true })
    .eq("festival_id", festival.id);

  let userLiked = false;
  try {
    const { user: authUser } = await getAuthenticatedContext(cookieStore);
    const { data: userLike } = await admin
      .from("festival_likes")
      .select("id")
      .eq("festival_id", festival.id)
      .eq("user_id", authUser.id)
      .single();
    userLiked = !!userLike;
  } catch {
    // unauthenticated — userLiked stays false
  }

  return {
    festival: {
      ...festival,
      lineup: lineupWithIds.length > 0 ? lineupWithIds : festival.lineup,
      likesCount: likesCount || 0,
      userLiked,
    },
  };
}

export async function createFestival(formData, cookieStore) {
  const { user, supabase } = await getAuthenticatedContext(cookieStore);
  const admin = getSupabaseAdminClient();

  const { data: userData, error: userFetchError } = await supabase
    .from("users")
    .select("submitted_festival_id")
    .eq("id", user.id)
    .single();

  if (userFetchError) throw new ServiceError("Failed to verify user", 500);
  if (userData.submitted_festival_id) {
    throw new ServiceError("You have already submitted a festival", 400);
  }

  const name = formData.get("name");
  const poster = formData.get("poster");
  const start_date = formData.get("start_date");
  const end_date = formData.get("end_date");
  const social_links = parseArrayField(formData, "social_links");

  if (!name || !poster)
    throw new ServiceError("Missing required fields: name, poster", 400);
  validateFestivalDates(start_date, end_date);
  validateImageFile({
    file: poster,
    maxSize: 10 * 1024 * 1024,
    requiredMessage: "Please upload a valid poster image",
  });

  const posterBaseName = `festivals/${user.id}_${Date.now()}_poster`;

  console.log(
    "[createFestival] Starting image upload. baseName:",
    posterBaseName,
  );

  let posterUrls;
  try {
    posterUrls = await processAndUploadImage(
      poster,
      admin,
      "festival_images",
      posterBaseName,
    );
    console.log("[createFestival] Image upload complete. URLs:", posterUrls);
  } catch (err) {
    console.error("[createFestival] Image upload failed:", err.message);
    throw new ServiceError(err.message || "Failed to upload poster image", 500);
  }

  const festival_slug = formData.get("festival_slug");

  console.log("[createFestival] Inserting festival into DB:", {
    name: String(name).trim(),
    status: "pending",
    user_id: user.id,
  });

  // Handle optional map image upload
  const mapImage = formData.get("map_image_url");
  let mapImageUrls = null;
  if (mapImage instanceof File && mapImage.size > 0) {
    validateImageFile({ file: mapImage, maxSize: 10 * 1024 * 1024 });
    const mapBaseName = `festivals/maps/${user.id}_${Date.now()}_map`;
    try {
      mapImageUrls = await processAndUploadMapImage(
        mapImage,
        admin,
        "festival_map_images",
        mapBaseName,
      );
    } catch (err) {
      throw new ServiceError(err.message || "Failed to upload map image", 500);
    }
  }

  const festival_genre = parseArrayField(formData, "festival_genre");
  const minimum_age = formData.get("minimum_age")?.trim() || null;

  const { data, error } = await supabase
    .from("festivals")
    .insert({
      name: String(name).trim(),
      festival_slug: festival_slug
        ? String(festival_slug).trim().toLowerCase()
        : null,
      description: formData.get("description")?.trim() || null,
      bio: formData.get("bio")?.trim() || null,
      image_url: posterUrls,
      map_image_url: mapImageUrls ? JSON.stringify(mapImageUrls) : null,
      start_date: start_date || null,
      end_date: end_date || null,
      location_url: formData.get("location_url")?.trim() || null,
      address: formData.get("address")?.trim() || null,
      capacity_total: formData.get("capacity_total")?.trim() || null,
      country: formData.get("country")?.trim() || null,
      city: formData.get("city")?.trim() || null,
      minimum_age: minimum_age ? Number(minimum_age) : null,
      festival_genre: festival_genre.length ? festival_genre : null,
      user_id: user.id,
      social_links: social_links.length ? social_links : null,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    console.error("[createFestival] DB insert failed:", error.message, error);
    // attempt best-effort cleanup of uploaded variants
    await deleteImageVariants(posterUrls, admin, "festival_images").catch(
      () => {},
    );
    throw new ServiceError("Failed to submit festival", 500);
  }

  console.log(
    "[createFestival] Festival created successfully. id:",
    data.id,
    "image_url:",
    data.image_url,
  );

  if (!user.is_admin) {
    await supabase
      .from("users")
      .update({ submitted_festival_id: data.id })
      .eq("id", user.id);
  }

  try {
    await admin.from("notifications").insert({
      user_id: user.id,
      title: "Your Festival Has Been Submitted",
      message: `Thank you for submitting "${String(name).trim()}" festival. Our team will review your submission and notify you once it's approved. You can view and edit your submission in your profile dashboard.`,
      type: "submit",
      read: false,
      created_at: new Date().toISOString(),
    });
  } catch {
    // Do not fail submission if notification insert fails.
  }

  revalidateTag("festivals");
  revalidateTag(`user-statistics-${user.id}`);

  return {
    success: true,
    message:
      "Festival submitted successfully! It will be reviewed by our team.",
    data,
  };
}

export async function updateFestival(formData, cookieStore) {
  const { user, supabase } = await getAuthenticatedContext(cookieStore);
  const admin = getSupabaseAdminClient();

  const festivalId = formData.get("festivalId");
  if (!festivalId)
    throw new ServiceError("Festival ID is required for updates", 400);

  const { data: existingFestival, error: fetchError } = await supabase
    .from("festivals")
    .select("id, user_id, image_url")
    .eq("id", festivalId)
    .single();

  if (fetchError || !existingFestival)
    throw new ServiceError("Festival not found", 404);
  if (existingFestival.user_id !== user.id && !user.is_admin) {
    throw new ServiceError(
      "You do not have permission to edit this festival",
      403,
    );
  }

  const name = formData.get("name");
  if (!name) throw new ServiceError("Festival name is required", 400);

  const start_date = formData.get("start_date") || null;
  const end_date = formData.get("end_date") || null;
  validateFestivalDates(start_date, end_date);

  const social_links = parseArrayField(formData, "social_links");
  const festival_genre = parseArrayField(formData, "festival_genre");
  const rawFestivalSlug = formData.get("festival_slug");
  const minimum_age = formData.get("minimum_age")?.trim() || null;
  const updateData = {
    name: String(name).trim(),
    festival_slug: rawFestivalSlug
      ? String(rawFestivalSlug).trim().toLowerCase()
      : null,
    description: formData.get("description")?.trim() || null,
    bio: formData.get("bio")?.trim() || null,
    start_date,
    end_date,
    location_url: formData.get("location_url")?.trim() || null,
    address: formData.get("address")?.trim() || null,
    capacity_total: formData.get("capacity_total")?.trim() || null,
    country: formData.get("country")?.trim() || null,
    city: formData.get("city")?.trim() || null,
    minimum_age: minimum_age ? Number(minimum_age) : null,
    festival_genre: festival_genre.length ? festival_genre : null,
    social_links: social_links.length ? social_links : null,
    updated_at: new Date().toISOString(),
  };

  const poster = formData.get("poster");
  if (poster instanceof File && poster.size > 0) {
    validateImageFile({
      file: poster,
      required: false,
      maxSize: 10 * 1024 * 1024,
    });

    await deleteImageVariants(
      existingFestival.image_url,
      admin,
      "festival_images",
    );

    const posterBaseName = `festivals/${user.id}_${Date.now()}_poster`;
    try {
      updateData.image_url = await processAndUploadImage(
        poster,
        admin,
        "festival_images",
        posterBaseName,
      );
    } catch (err) {
      throw new ServiceError(
        err.message || "Failed to upload poster image",
        500,
      );
    }
  }

  // Handle optional map image update
  const mapImage = formData.get("map_image_url");
  if (mapImage instanceof File && mapImage.size > 0) {
    validateImageFile({
      file: mapImage,
      required: false,
      maxSize: 10 * 1024 * 1024,
    });
    if (existingFestival.map_image_url) {
      await deleteImageVariants(
        existingFestival.map_image_url,
        admin,
        "festival_map_images",
      ).catch(() => {});
    }
    const mapBaseName = `festivals/maps/${user.id}_${Date.now()}_map`;
    try {
      const mapUrls = await processAndUploadMapImage(
        mapImage,
        admin,
        "festival_map_images",
        mapBaseName,
      );
      updateData.map_image_url = JSON.stringify(mapUrls);
    } catch (err) {
      throw new ServiceError(err.message || "Failed to upload map image", 500);
    }
  }

  const { data, error } = await supabase
    .from("festivals")
    .update(updateData)
    .eq("id", festivalId)
    .select()
    .single();

  if (error) throw new ServiceError("Failed to update festival", 500);

  revalidateTag("festivals");
  revalidateTag(`user-statistics-${user.id}`);

  return { success: true, message: "Festival updated successfully!", data };
}
