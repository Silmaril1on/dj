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
} from "./shared";

export async function getEventById(id, cookieStore) {
  if (!id) throw new ServiceError("Event ID is required", 400);
  const supabase = await getSupabaseServerClient(cookieStore);
  const { data, error } = await supabase.from("events").select("*").eq("id", id).single();
  if (error || !data) throw new ServiceError("Event not found", 404);
  return data;
}

export async function createEvent(formData, cookieStore) {
  const { user, supabase } = await getAuthenticatedContext(cookieStore);

  const fields = {
    event_name: formData.get("event_name"),
    venue_name: formData.get("venue_name"),
    event_type: formData.get("event_type"),
    country: formData.get("country"),
    city: formData.get("city"),
    address: formData.get("address"),
    location_url: formData.get("location_url"),
    promoter: formData.get("promoter"),
    date: formData.get("date"),
    doors_open: formData.get("doors_open"),
    description: formData.get("description"),
    links: formData.get("links"),
  };

  const required = ["event_name", "event_type", "country", "city", "date", "promoter"];
  const missing = required.filter((field) => !fields[field] || String(fields[field]).trim() === "");
  if (missing.length) {
    throw new ServiceError(`Missing required fields: ${missing.join(", ")}`, 400);
  }

  const artists = parseArrayField(formData, "artists");
  if (!artists.length) throw new ServiceError("At least one artist is required", 400);

  let eventImageUrl = null;
  const eventImage = formData.get("event_image");
  if (eventImage instanceof File && eventImage.size > 0) {
    validateImageFile({ file: eventImage, required: false, maxSize: 1 * 1024 * 1024 });
    const fileExtension = sanitizeFileExtension(eventImage.name);
    const fileName = `${sanitizeStorageBaseName(fields.event_name, "event")}_${Date.now()}.${fileExtension}`;
    const { error: uploadError } = await supabase.storage
      .from("event_images")
      .upload(fileName, eventImage, { cacheControl: "3600", upsert: false });
    if (uploadError) throw new ServiceError("Failed to upload image", 500);
    const { data } = supabase.storage.from("event_images").getPublicUrl(fileName);
    eventImageUrl = data.publicUrl;
  }

  const eventData = {
    user_id: user.id,
    ...fields,
    artists,
    event_image: eventImageUrl,
    created_at: new Date().toISOString(),
  };

  const { data: event, error: insertError } = await supabase
    .from("events")
    .insert(eventData)
    .select()
    .single();
  if (insertError) throw new ServiceError("Failed to create event", 500);

  if (artists.length > 0) {
    const { data: matchedArtists } = await supabase
      .from("artists")
      .select("id, name, stage_name")
      .or(
        artists
          .map((artistName) => `name.ilike.${artistName},stage_name.ilike.${artistName}`)
          .join(","),
      );

    if (matchedArtists?.length) {
      const scheduleEntries = matchedArtists.map((artist) => ({
        artist_id: artist.id,
        event_id: event.id,
        date: fields.date,
        time: fields.doors_open || null,
        country: fields.country,
        city: fields.city,
        club_name: fields.venue_name || null,
        event_link: fields.location_url || null,
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      await supabase.from("artist_schedule").insert(scheduleEntries);
    }
  }

  const { data: userData } = await supabase
    .from("users")
    .select("submitted_event_id")
    .eq("id", user.id)
    .single();
  if (userData) {
    const updatedIds = [...(userData.submitted_event_id || []), event.id];
    await supabase.from("users").update({ submitted_event_id: updatedIds }).eq("id", user.id);
  }

  revalidateTag("events");
  revalidateTag(`user-statistics-${user.id}`);
  revalidateTag(`user-statistics-submitted-events-${user.id}`);
  revalidateTag("user-statistics-submitted-events");

  return { success: true, message: "Event created successfully", data: event };
}

export async function updateEvent(formData, cookieStore) {
  const { user, supabase } = await getAuthenticatedContext(cookieStore);
  const eventId = formData.get("eventId");
  if (!eventId) throw new ServiceError("Missing eventId", 400);

  const { data: existingEvent, error: fetchError } = await supabase
    .from("events")
    .select("id, event_image, user_id")
    .eq("id", eventId)
    .single();
  if (fetchError || !existingEvent) throw new ServiceError("Event not found", 404);

  if (existingEvent.user_id !== user.id && !user.is_admin) {
    throw new ServiceError("You are not allowed to edit this event", 403);
  }

  const updateFields = {};
  for (const [key, value] of formData.entries()) {
    if (
      key === "eventId" ||
      key === "event_image" ||
      value === undefined ||
      value === null ||
      value === ""
    ) {
      continue;
    }

    if (["artists", "links"].includes(key)) {
      try {
        updateFields[key] = JSON.parse(value);
      } catch {
        updateFields[key] = value;
      }
    } else {
      updateFields[key] = value;
    }
  }

  const eventImage = formData.get("event_image");
  if (eventImage instanceof File && eventImage.size > 0) {
    validateImageFile({ file: eventImage, required: false, maxSize: 1 * 1024 * 1024 });
    const oldImagePath = extractPublicObjectPath(existingEvent.event_image, "event_images");
    if (oldImagePath) {
      await supabase.storage.from("event_images").remove([oldImagePath]);
    }

    const fileExtension = sanitizeFileExtension(eventImage.name);
    const fileName = `event_${eventId}_${Date.now()}.${fileExtension}`;
    const { error: uploadError } = await supabase.storage
      .from("event_images")
      .upload(fileName, eventImage, { cacheControl: "3600", upsert: true });
    if (uploadError) throw new ServiceError("Failed to upload image", 500);

    const { data } = supabase.storage.from("event_images").getPublicUrl(fileName);
    updateFields.event_image = data.publicUrl;
  }

  const { data, error } = await supabase
    .from("events")
    .update(updateFields)
    .eq("id", eventId)
    .select()
    .single();
  if (error) throw new ServiceError("Failed to update event", 500);

  revalidateTag("events");
  revalidateTag(`user-statistics-${user.id}`);
  revalidateTag(`user-statistics-submitted-events-${user.id}`);
  revalidateTag("user-statistics-submitted-events");

  return { success: true, message: "Event updated successfully", data };
}
