import { revalidateTag } from "next/cache";
import {
  ServiceError,
  parseArrayField,
  validateImageFile,
  extractPublicObjectPath,
  sanitizeStorageBaseName,
  sanitizeFileExtension,
  getAuthenticatedContext,
  getSupabaseServerClient,
  getSupabaseAdminClient,
} from "../shared";

const CLUB_SELECT_LIMITED =
  "id, name, country, city, club_image, capacity, address";

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

export async function getAllClubs({ limit = 20, offset = 0 } = {}) {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("clubs")
    .select(CLUB_SELECT_LIMITED)
    .eq("status", "approved")
    .order("name", { ascending: true })
    .range(offset, offset + limit - 1);
  if (error) throw new ServiceError(error.message, 500);
  return { clubs: data || [], limit, offset };
}

export async function getClubById(id, cookieStore) {
  if (!id) throw new ServiceError("Club ID is required", 400);
  const supabase = await getSupabaseServerClient(cookieStore);
  const { data, error } = await supabase
    .from("clubs")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) throw new ServiceError("Club not found", 404);
  return { club: data };
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
    maxSize: 1 * 1024 * 1024,
    requiredMessage: "Club image is required",
  });

  const fileExtension = sanitizeFileExtension(clubImage.name);
  const fileName = `${sanitizeStorageBaseName(name, "club")}_${Date.now()}.${fileExtension}`;

  const { error: uploadError } = await admin.storage
    .from("club_images")
    .upload(fileName, clubImage, { cacheControl: "3600", upsert: false });
  if (uploadError) throw new ServiceError("Failed to upload image", 500);

  const {
    data: { publicUrl },
  } = admin.storage.from("club_images").getPublicUrl(fileName);

  const social_links = parseArrayField(formData, "social_links");
  const residents = parseArrayField(formData, "residents");

  const clubData = {
    user_id: user.id,
    name,
    country,
    city,
    capacity,
    description,
    social_links,
    residents,
    status: "pending",
    club_image: publicUrl,
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

  const { data: newClub, error: insertError } = await admin
    .from("clubs")
    .insert([clubData])
    .select()
    .single();
  if (insertError)
    throw new ServiceError(
      `Failed to create club: ${insertError.message}`,
      500,
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

  let clubImageUrl = existingClub.club_image;
  const clubImage = formData.get("club_image");
  if (clubImage instanceof File && clubImage.size > 0) {
    validateImageFile({
      file: clubImage,
      required: false,
      maxSize: 1 * 1024 * 1024,
    });
    const oldImagePath = extractPublicObjectPath(
      existingClub.club_image,
      "club_images",
    );
    if (oldImagePath) {
      await admin.storage.from("club_images").remove([oldImagePath]);
    }

    const safeName = name || existingClub.name || "club";
    const fileExtension = sanitizeFileExtension(clubImage.name);
    const fileName = `${sanitizeStorageBaseName(safeName, "club")}_${Date.now()}.${fileExtension}`;

    const { error: uploadError } = await admin.storage
      .from("club_images")
      .upload(fileName, clubImage, { cacheControl: "3600", upsert: false });

    if (uploadError) throw new ServiceError("Failed to upload image", 500);
    const {
      data: { publicUrl },
    } = admin.storage.from("club_images").getPublicUrl(fileName);
    clubImageUrl = publicUrl;
  }

  const updateData = {
    name: formData.get("name"),
    country: formData.get("country"),
    city: formData.get("city"),
    capacity: formData.get("capacity"),
    description: formData.get("description"),
    address: formData.get("address"),
    residents: parseArrayField(formData, "residents"),
    social_links: parseArrayField(formData, "social_links"),
    club_image: clubImageUrl,
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

  if (existingClub.club_image) {
    const oldImagePath = extractPublicObjectPath(
      existingClub.club_image,
      "club_images",
    );
    if (oldImagePath) {
      await admin.storage.from("club_images").remove([oldImagePath]);
    }
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
