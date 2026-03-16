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

export async function getFestivalById(id, cookieStore) {
  if (!id) throw new ServiceError("Festival ID is required", 400);
  const supabase = await getSupabaseServerClient(cookieStore);
  const { data, error } = await supabase.from("festivals").select("*").eq("id", id).single();
  if (error || !data) throw new ServiceError("Festival not found", 404);
  return { festival: data };
}

const validateFestivalDates = (startDate, endDate) => {
  if (startDate && endDate) {
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    if (endDateObj < startDateObj) {
      throw new ServiceError("End date must be after start date", 400);
    }
  }
};

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
  const description = formData.get("description");
  const bio = formData.get("bio");
  const poster = formData.get("poster");
  const start_date = formData.get("start_date");
  const end_date = formData.get("end_date");
  const location = formData.get("location");
  const capacity_total = formData.get("capacity_total");
  const capacity_per_day = formData.get("capacity_per_day");
  const country = formData.get("country");
  const city = formData.get("city");
  const social_links = parseArrayField(formData, "social_links");

  if (!name || !poster) throw new ServiceError("Missing required fields: name, poster", 400);
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

  const { data: posterUrlData } = admin.storage.from("festival_images").getPublicUrl(posterPath);

  const { data, error } = await supabase
    .from("festivals")
    .insert({
      name: String(name).trim(),
      description: description ? String(description).trim() : null,
      bio: bio ? String(bio).trim() : null,
      poster: posterUrlData.publicUrl,
      start_date: start_date || null,
      end_date: end_date || null,
      location: location ? String(location).trim() : null,
      capacity_total: capacity_total ? String(capacity_total).trim() : null,
      capacity_per_day: capacity_per_day ? String(capacity_per_day).trim() : null,
      country: country ? String(country).trim() : null,
      city: city ? String(city).trim() : null,
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

  await supabase.from("users").update({ submitted_festival_id: data.id }).eq("id", user.id);

  revalidateTag("festivals");
  revalidateTag(`user-statistics-${user.id}`);

  return {
    success: true,
    message: "Festival submitted successfully! It will be reviewed by our team.",
    data,
  };
}

export async function updateFestival(formData, cookieStore) {
  const { user, supabase } = await getAuthenticatedContext(cookieStore);
  const admin = getSupabaseAdminClient();
  const festivalId = formData.get("festivalId");
  if (!festivalId) throw new ServiceError("Festival ID is required for updates", 400);

  const { data: existingFestival, error: fetchError } = await supabase
    .from("festivals")
    .select("id, user_id, poster")
    .eq("id", festivalId)
    .single();

  if (fetchError || !existingFestival) throw new ServiceError("Festival not found", 404);
  if (existingFestival.user_id !== user.id && !user.is_admin) {
    throw new ServiceError("You do not have permission to edit this festival", 403);
  }

  const name = formData.get("name");
  if (!name) throw new ServiceError("Festival name is required", 400);

  const updateData = {
    name: String(name).trim(),
    description: formData.get("description")?.trim() || null,
    bio: formData.get("bio")?.trim() || null,
    start_date: formData.get("start_date") || null,
    end_date: formData.get("end_date") || null,
    location: formData.get("location")?.trim() || null,
    capacity_total: formData.get("capacity_total")?.trim() || null,
    capacity_per_day: formData.get("capacity_per_day")?.trim() || null,
    country: formData.get("country")?.trim() || null,
    city: formData.get("city")?.trim() || null,
    social_links: parseArrayField(formData, "social_links"),
    updated_at: new Date().toISOString(),
  };

  validateFestivalDates(updateData.start_date, updateData.end_date);

  const poster = formData.get("poster");
  if (poster instanceof File && poster.size > 0) {
    validateImageFile({ file: poster, required: false, maxSize: 5 * 1024 * 1024 });
    const fileExtension = sanitizeFileExtension(poster.name);
    const posterPath = `festivals/${user.id}-${Date.now()}-poster.${fileExtension}`;

    const { error: posterUploadError } = await admin.storage
      .from("festival_images")
      .upload(posterPath, poster, { contentType: poster.type, upsert: false });
    if (posterUploadError) throw new ServiceError("Failed to upload poster image", 500);

    const { data: posterUrlData } = admin.storage
      .from("festival_images")
      .getPublicUrl(posterPath);
    updateData.poster = posterUrlData.publicUrl;

    const oldPosterPath = extractPublicObjectPath(existingFestival.poster, "festival_images");
    if (oldPosterPath) {
      await admin.storage.from("festival_images").remove([oldPosterPath]);
    }
  }

  const { data, error } = await supabase
    .from("festivals")
    .update({
      ...updateData,
      social_links: updateData.social_links.length ? updateData.social_links : null,
    })
    .eq("id", festivalId)
    .select()
    .single();

  if (error) throw new ServiceError("Failed to update festival", 500);

  revalidateTag("festivals");
  revalidateTag(`user-statistics-${user.id}`);

  return { success: true, message: "Festival updated successfully!", data };
}
