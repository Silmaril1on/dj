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
} from "./shared";

export async function getArtistById(id, cookieStore) {
  if (!id) throw new ServiceError("Artist ID is required", 400);
  const supabase = await getSupabaseServerClient(cookieStore);
  const { data, error } = await supabase
    .from("artists")
    .select(
      "id, name, stage_name, country, city, sex, is_band, birth, desc, bio, genres, social_links, label, artist_image, status, created_at, updated_at",
    )
    .eq("id", id)
    .single();

  if (error || !data) throw new ServiceError("Artist not found", 404);
  return data;
}

export async function createArtist(formData, cookieStore) {
  const { user, supabase } = await getAuthenticatedContext(cookieStore);
  const admin = getSupabaseAdminClient();

  const name = formData.get("name");
  const artistImage = formData.get("artist_image");
  const stage_name = formData.get("stage_name");
  const sex = formData.get("sex");
  const is_band = formData.get("is_band");
  const desc = formData.get("desc");
  const country = formData.get("country");
  const city = formData.get("city");
  const bio = formData.get("bio");
  const birth = formData.get("birth");

  if (!name || !artistImage || !desc || !country) {
    throw new ServiceError(
      "Missing required fields: name, artist_image, desc, country",
      400,
    );
  }

  validateImageFile({
    file: artistImage,
    maxSize: 1 * 1024 * 1024,
    requiredMessage: "Artist image is required",
  });

  const genres = parseArrayField(formData, "genres");
  const social_links = parseArrayField(formData, "social_links");
  const label = parseArrayField(formData, "label");

  const randomId = Math.random().toString(36).substring(2, 15);
  const fileExtension = sanitizeFileExtension(artistImage.name);
  const fileName = `artist_${Date.now()}_${randomId}.${fileExtension}`;

  const { error: uploadError } = await admin.storage
    .from("artist_profile_images")
    .upload(fileName, artistImage, { cacheControl: "3600", upsert: false });

  if (uploadError) throw new ServiceError("Failed to upload image", 500);

  const {
    data: { publicUrl },
  } = admin.storage.from("artist_profile_images").getPublicUrl(fileName);

  const artistData = {
    name,
    artist_image: publicUrl,
    stage_name: stage_name || null,
    sex: sex || null,
    is_band: is_band === "true",
    desc,
    country,
    city: city || null,
    label,
    bio: bio || null,
    birth: is_band === "true" ? null : birth || null,
    genres,
    social_links,
    status: "pending",
    user_id: user.id,
  };

  const { data: newArtist, error: insertError } = await admin
    .from("artists")
    .insert([artistData])
    .select()
    .single();

  if (insertError) {
    throw new ServiceError(`Failed to create artist: ${insertError.message}`, 500);
  }

  await supabase.from("users").update({ submitted_artist_id: newArtist.id }).eq("id", user.id);

  try {
    await admin.from("notifications").insert({
      user_id: user.id,
      title: "Your DJ Profile Has Been Submitted",
      message: `Thank you for submitting your DJ profile "${stage_name || name}". Our team will review your submission and notify you once it's approved. You can view and edit your submission in your profile dashboard.`,
      type: "submit",
      read: false,
      created_at: new Date().toISOString(),
    });
  } catch {
    // Do not fail submission if notification insert fails.
  }

  revalidateTag("artists");
  revalidateTag(`user-statistics-${user.id}`);
  revalidateTag(`user-statistics-submitted-artist-${user.id}`);
  revalidateTag("user-statistics-submitted-artist");

  return {
    success: true,
    message: "Artist submitted successfully and is pending approval",
    data: newArtist,
  };
}

export async function updateArtist(formData, cookieStore) {
  const { user, supabase } = await getAuthenticatedContext(cookieStore);
  const admin = getSupabaseAdminClient();
  const artistIdRaw = formData.get("artistId");
  const artistId = artistIdRaw ? String(artistIdRaw).trim() : "";

  if (!artistId) throw new ServiceError("Artist ID is required", 400);

  const { data: profile } = await supabase
    .from("users")
    .select("submitted_artist_id, is_admin")
    .eq("id", user.id)
    .single();

  const submittedArtistId = profile?.submitted_artist_id
    ? String(profile.submitted_artist_id).trim()
    : null;
  const isAdmin = Boolean(profile?.is_admin);

  if (!isAdmin && (!submittedArtistId || submittedArtistId !== artistId)) {
    throw new ServiceError("You can only update your own submitted artist", 403);
  }

  const { data: existingArtist, error: existingError } = await supabase
    .from("artists")
    .select("artist_image")
    .eq("id", artistId)
    .single();

  if (existingError || !existingArtist) throw new ServiceError("Artist not found", 404);

  const updateFields = {
    name: formData.get("name"),
    stage_name: formData.get("stage_name"),
    country: formData.get("country"),
    city: formData.get("city"),
    sex: formData.get("sex"),
    desc: formData.get("desc"),
    bio: formData.get("bio"),
    birth: formData.get("birth"),
    genres: parseArrayField(formData, "genres"),
    social_links: parseArrayField(formData, "social_links"),
    label: parseArrayField(formData, "label"),
  };

  const isBandValue = formData.get("is_band");
  if (isBandValue !== null) {
    updateFields.is_band = isBandValue === "true";
    if (updateFields.is_band) updateFields.birth = null;
  }

  const artistImage = formData.get("artist_image");
  if (artistImage instanceof File && artistImage.size > 0) {
    validateImageFile({
      file: artistImage,
      maxSize: 1 * 1024 * 1024,
      required: false,
    });

    const oldImagePath = extractPublicObjectPath(
      existingArtist.artist_image,
      "artist_profile_images",
    );
    if (oldImagePath) {
      await admin.storage.from("artist_profile_images").remove([oldImagePath]);
    }

    const randomId = Math.random().toString(36).substring(2, 15);
    const fileExtension = sanitizeFileExtension(artistImage.name);
    const fileName = `artist_${Date.now()}_${randomId}.${fileExtension}`;

    const { error: uploadError } = await admin.storage
      .from("artist_profile_images")
      .upload(fileName, artistImage, { cacheControl: "3600", upsert: false });

    if (uploadError) throw new ServiceError("Failed to upload image", 500);

    const {
      data: { publicUrl },
    } = admin.storage.from("artist_profile_images").getPublicUrl(fileName);

    updateFields.artist_image = publicUrl;
  }

  Object.keys(updateFields).forEach((key) => {
    if (updateFields[key] === null || updateFields[key] === undefined) delete updateFields[key];
  });
  updateFields.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("artists")
    .update(updateFields)
    .eq("id", artistId)
    .select()
    .single();

  if (error) throw new ServiceError("Failed to update artist", 500);

  return { success: true, message: "Artist updated successfully", data };
}
