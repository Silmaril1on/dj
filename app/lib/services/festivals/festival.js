import { revalidateTag } from "next/cache";
import {
  ServiceError,
  parseArrayField,
  validateImageFile,
  extractPublicObjectPath,
  sanitizeFileExtension,
  getAuthenticatedContext,
  getSupabaseServerClient,
  getSupabaseAdminClient,
} from "../shared";
import { getServerUser } from "@/app/lib/config/supabaseServer";

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
} = {}) {
  const admin = getSupabaseAdminClient();

  let query = admin
    .from("festivals")
    .select(
      "id, name, festival_slug, poster, country, city, location, start_date, end_date, description, created_at",
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
  if (festivalIds.length > 0) {
    const { data: likesData } = await admin
      .from("festivals_likes")
      .select("festival_id")
      .in("festival_id", festivalIds);
    (likesData || []).forEach((l) => {
      likesCount[l.festival_id] = (likesCount[l.festival_id] || 0) + 1;
    });
  }

  let festivalsWithLikes = festivals.map((festival) => ({
    ...festival,
    likesCount: likesCount[festival.id] || 0,
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

  const { data: festival, error } = await supabase
    .from("festivals")
    .select("*")
    .eq("festival_slug", slug)
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

  return {
    festival: {
      ...festival,
      lineup: lineupWithIds.length > 0 ? lineupWithIds : festival.lineup,
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
    maxSize: 2 * 1024 * 1024,
    requiredMessage: "Please upload a valid poster image",
  });

  const fileExtension = sanitizeFileExtension(poster.name);
  const posterPath = `festivals/${user.id}-${Date.now()}-poster.${fileExtension}`;

  const { error: uploadError } = await admin.storage
    .from("festival_images")
    .upload(posterPath, poster, { contentType: poster.type, upsert: false });
  if (uploadError) throw new ServiceError("Failed to upload poster image", 500);

  const { data: posterUrlData } = admin.storage
    .from("festival_images")
    .getPublicUrl(posterPath);

  const festival_slug = formData.get("festival_slug");

  const { data, error } = await supabase
    .from("festivals")
    .insert({
      name: String(name).trim(),
      festival_slug: festival_slug
        ? String(festival_slug).trim().toLowerCase()
        : null,
      description: formData.get("description")?.trim() || null,
      bio: formData.get("bio")?.trim() || null,
      poster: posterUrlData.publicUrl,
      start_date: start_date || null,
      end_date: end_date || null,
      location: formData.get("location")?.trim() || null,
      capacity_total: formData.get("capacity_total")?.trim() || null,
      capacity_per_day: formData.get("capacity_per_day")?.trim() || null,
      country: formData.get("country")?.trim() || null,
      city: formData.get("city")?.trim() || null,
      user_id: user.id,
      social_links: social_links.length ? social_links : null,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    await admin.storage.from("festival_images").remove([posterPath]);
    throw new ServiceError("Failed to submit festival", 500);
  }

  await supabase
    .from("users")
    .update({ submitted_festival_id: data.id })
    .eq("id", user.id);

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
    .select("id, user_id, poster")
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
  const rawFestivalSlug = formData.get("festival_slug");
  const updateData = {
    name: String(name).trim(),
    festival_slug: rawFestivalSlug
      ? String(rawFestivalSlug).trim().toLowerCase()
      : null,
    description: formData.get("description")?.trim() || null,
    bio: formData.get("bio")?.trim() || null,
    start_date,
    end_date,
    location: formData.get("location")?.trim() || null,
    capacity_total: formData.get("capacity_total")?.trim() || null,
    capacity_per_day: formData.get("capacity_per_day")?.trim() || null,
    country: formData.get("country")?.trim() || null,
    city: formData.get("city")?.trim() || null,
    social_links: social_links.length ? social_links : null,
    updated_at: new Date().toISOString(),
  };

  const poster = formData.get("poster");
  if (poster instanceof File && poster.size > 0) {
    validateImageFile({
      file: poster,
      required: false,
      maxSize: 5 * 1024 * 1024,
    });
    const fileExtension = sanitizeFileExtension(poster.name);
    const posterPath = `festivals/${user.id}-${Date.now()}-poster.${fileExtension}`;

    const { error: uploadError } = await admin.storage
      .from("festival_images")
      .upload(posterPath, poster, { contentType: poster.type, upsert: false });
    if (uploadError)
      throw new ServiceError("Failed to upload poster image", 500);

    const { data: posterUrlData } = admin.storage
      .from("festival_images")
      .getPublicUrl(posterPath);
    updateData.poster = posterUrlData.publicUrl;

    const oldPosterPath = extractPublicObjectPath(
      existingFestival.poster,
      "festival_images",
    );
    if (oldPosterPath)
      await admin.storage.from("festival_images").remove([oldPosterPath]);
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
