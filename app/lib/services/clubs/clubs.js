import { revalidateTag } from "next/cache";
import {
  ServiceError,
  parseArrayField,
  validateImageFile,
  sanitizeStorageBaseName,
  getAuthenticatedContext,
  getSupabaseServerClient,
  getSupabaseAdminClient,
} from "../shared";
import {
  processAndUploadImage,
  deleteImageVariants,
} from "@/app/lib/services/imageProcessing";

const CLUB_SELECT_LIMITED =
  "id, name, club_slug, country, city, image_url, capacity, address";

const validateClubContactFields = ({ location_url, venue_email }) => {
  if (venue_email && String(venue_email).trim() !== "") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(venue_email).trim())) {
      throw new ServiceError("Please provide a valid email address", 400);
    }
  }

  if (location_url && String(location_url).trim() !== "") {
    try {
      new URL(String(location_url).trim());
    } catch {
      throw new ServiceError("Please provide a valid location URL", 400);
    }
  }
};

export async function getAllClubs({
  limit = 20,
  offset = 0,
  userId = null,
} = {}) {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("clubs")
    .select(CLUB_SELECT_LIMITED)
    .eq("status", "approved")
    .order("name", { ascending: true })
    .range(offset, offset + limit - 1);
  if (error) throw new ServiceError(error.message, 500);

  const clubs = data || [];
  const clubIds = clubs.map((c) => c.id);

  let likesMap = {};
  let userLikedSet = new Set();

  if (clubIds.length > 0) {
    const likesQuery = admin
      .from("club_likes")
      .select("club_id, user_id")
      .in("club_id", clubIds);
    const { data: likesData } = await likesQuery;
    (likesData || []).forEach((l) => {
      likesMap[l.club_id] = (likesMap[l.club_id] || 0) + 1;
      if (userId && l.user_id === userId) userLikedSet.add(l.club_id);
    });
  }

  return {
    clubs: clubs.map((c) => ({
      ...c,
      likesCount: likesMap[c.id] || 0,
      userLiked: userLikedSet.has(c.id),
    })),
    limit,
    offset,
  };
}

export async function getClubById(id, cookieStore) {
  if (!id) throw new ServiceError("Club ID is required", 400);
  const admin = getSupabaseAdminClient();
  const supabase = await getSupabaseServerClient(cookieStore);
  const isUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const baseQuery = supabase.from("clubs").select("*");
  const { data, error } = await (
    isUUID ? baseQuery.eq("id", id) : baseQuery.eq("club_slug", id)
  ).single();
  if (error || !data) throw new ServiceError("Club not found", 404);

  const { count: likesCount } = await admin
    .from("club_likes")
    .select("*", { count: "exact", head: true })
    .eq("club_id", data.id);

  let userLiked = false;
  try {
    const { user: authUser } = await getAuthenticatedContext(cookieStore);
    const { data: userLike } = await admin
      .from("club_likes")
      .select("id")
      .eq("club_id", data.id)
      .eq("user_id", authUser.id)
      .single();
    userLiked = !!userLike;
  } catch {
    // unauthenticated — userLiked stays false
  }

  return { club: { ...data, likesCount: likesCount || 0, userLiked } };
}

export async function createClub(formData, cookieStore) {
  const { user, supabase } = await getAuthenticatedContext(cookieStore);
  const admin = getSupabaseAdminClient();

  const name = formData.get("name");
  const country = formData.get("country");
  const city = formData.get("city");
  const capacity = formData.get("capacity");
  const description = formData.get("description");
  const clubImage = formData.get("club_image");
  const address = formData.get("address");
  const location_url = formData.get("location_url");
  const venue_email = formData.get("venue_email");

  if (!name || !country || !city || !capacity || !description || !clubImage) {
    throw new ServiceError(
      "Missing required fields: name, country, city, capacity, description, club_image",
      400,
    );
  }

  validateClubContactFields({ location_url, venue_email });
  validateImageFile({
    file: clubImage,
    maxSize: 10 * 1024 * 1024,
    requiredMessage: "Club image is required",
  });

  const fileExtension = sanitizeStorageBaseName(name, "club");
  const baseName = `${fileExtension}_${Date.now()}`;

  console.log("[createClub] Starting image upload. baseName:", baseName);

  let imageUrls;
  try {
    imageUrls = await processAndUploadImage(
      clubImage,
      admin,
      "club_images",
      baseName,
    );
    console.log("[createClub] Image upload complete. URLs:", imageUrls);
  } catch (err) {
    console.error("[createClub] Image upload failed:", err.message);
    throw new ServiceError(err.message || "Failed to upload image", 500);
  }

  const social_links = parseArrayField(formData, "social_links");
  const residents = parseArrayField(formData, "residents");

  const club_slug = formData.get("club_slug");

  const clubData = {
    user_id: user.id,
    name,
    club_slug: club_slug ? String(club_slug).trim().toLowerCase() : null,
    country,
    city,
    capacity,
    description,
    social_links,
    residents,
    status: "pending",
    image_url: imageUrls,
    address: address || null,
    location_url:
      location_url && String(location_url).trim() !== ""
        ? String(location_url).trim()
        : null,
    venue_email:
      venue_email && String(venue_email).trim() !== ""
        ? String(venue_email).trim()
        : null,
  };

  console.log("[createClub] Inserting club into DB:", {
    name,
    status: "pending",
    user_id: user.id,
  });

  const { data: newClub, error: insertError } = await admin
    .from("clubs")
    .insert([clubData])
    .select()
    .single();
  if (insertError) {
    console.error(
      "[createClub] DB insert failed:",
      insertError.message,
      insertError,
    );
    throw new ServiceError(
      `Failed to create club: ${insertError.message}`,
      500,
    );
  }

  console.log(
    "[createClub] Club created successfully. id:",
    newClub.id,
    "image_url:",
    newClub.image_url,
  );

  if (!user.is_admin) {
    await supabase
      .from("users")
      .update({ submitted_club_id: newClub.id })
      .eq("id", user.id);
  }

  try {
    await admin.from("notifications").insert({
      user_id: user.id,
      title: "Your Club Has Been Submitted",
      message: `Thank you for submitting "${name}" club profile. Our team will review your submission and notify you once it's approved. You can view and edit your submission in your profile dashboard.`,
      type: "submit",
      read: false,
      created_at: new Date().toISOString(),
    });
  } catch {
    // Do not fail submission if notification insert fails.
  }

  revalidateTag("clubs");
  revalidateTag(`user-statistics-${user.id}`);
  revalidateTag(`user-statistics-submitted-club-${user.id}`);
  revalidateTag("user-statistics-submitted-club");

  return {
    success: true,
    message: "Club submitted successfully and is pending approval",
    data: newClub,
  };
}

export async function updateClub(formData, cookieStore) {
  const { user } = await getAuthenticatedContext(cookieStore);
  const admin = getSupabaseAdminClient();

  const clubId = formData.get("clubId");
  if (!clubId) throw new ServiceError("Missing clubId", 400);

  const { data: existingClub, error: fetchError } = await admin
    .from("clubs")
    .select("*")
    .eq("id", clubId)
    .single();
  if (fetchError || !existingClub)
    throw new ServiceError("Club not found", 404);

  if (existingClub.user_id !== user.id && !user.is_admin) {
    throw new ServiceError("You are not allowed to edit this club", 403);
  }

  const name = formData.get("name");
  const location_url = formData.get("location_url");
  const venue_email = formData.get("venue_email");
  validateClubContactFields({ location_url, venue_email });

  let clubImageUrl = existingClub.image_url;
  const clubImage = formData.get("club_image");
  if (clubImage instanceof File && clubImage.size > 0) {
    validateImageFile({
      file: clubImage,
      required: false,
      maxSize: 10 * 1024 * 1024,
    });

    await deleteImageVariants(existingClub.image_url, admin, "club_images");

    const safeName = sanitizeStorageBaseName(
      name || existingClub.name || "club",
      "club",
    );
    const baseName = `${safeName}_${Date.now()}`;

    try {
      clubImageUrl = await processAndUploadImage(
        clubImage,
        admin,
        "club_images",
        baseName,
      );
    } catch (err) {
      throw new ServiceError(err.message || "Failed to upload image", 500);
    }
  }

  const rawSlug = formData.get("club_slug");
  const updateData = {
    name: formData.get("name"),
    club_slug: rawSlug ? String(rawSlug).trim().toLowerCase() : null,
    country: formData.get("country"),
    city: formData.get("city"),
    capacity: formData.get("capacity"),
    description: formData.get("description"),
    address: formData.get("address"),
    residents: parseArrayField(formData, "residents"),
    social_links: parseArrayField(formData, "social_links"),
    image_url: clubImageUrl,
    location_url:
      location_url && String(location_url).trim() !== ""
        ? String(location_url).trim()
        : null,
    venue_email:
      venue_email && String(venue_email).trim() !== ""
        ? String(venue_email).trim()
        : null,
    updated_at: new Date().toISOString(),
  };

  Object.keys(updateData).forEach(
    (key) => updateData[key] === undefined && delete updateData[key],
  );

  const { data, error } = await admin
    .from("clubs")
    .update(updateData)
    .eq("id", clubId)
    .select()
    .single();
  if (error)
    throw new ServiceError(`Failed to update club: ${error.message}`, 500);

  revalidateTag("clubs");
  revalidateTag(`user-statistics-${user.id}`);
  revalidateTag(`user-statistics-submitted-club-${user.id}`);
  revalidateTag("user-statistics-submitted-club");

  return { success: true, message: "Club updated successfully", data };
}

export async function deleteClub(clubId, cookieStore) {
  if (!clubId) throw new ServiceError("Missing clubId", 400);
  const { user } = await getAuthenticatedContext(cookieStore);
  const admin = getSupabaseAdminClient();

  const { data: existingClub, error: fetchError } = await admin
    .from("clubs")
    .select("*")
    .eq("id", clubId)
    .single();
  if (fetchError || !existingClub)
    throw new ServiceError("Club not found", 404);

  if (existingClub.user_id !== user.id && !user.is_admin) {
    throw new ServiceError("You are not allowed to delete this club", 403);
  }

  if (existingClub.image_url) {
    await deleteImageVariants(existingClub.image_url, admin, "club_images");
  }

  const { error } = await admin.from("clubs").delete().eq("id", clubId);
  if (error)
    throw new ServiceError(`Failed to delete club: ${error.message}`, 500);

  revalidateTag("clubs");
  revalidateTag(`user-statistics-${user.id}`);
  revalidateTag(`user-statistics-submitted-club-${user.id}`);
  revalidateTag("user-statistics-submitted-club");

  return { success: true, message: "Club deleted successfully" };
}
