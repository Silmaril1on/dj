"use server";
import { revalidateTag } from "next/cache";
import { getTodayDateOnlyString } from "@/app/helpers/utils";
import { getServerUser, supabaseAdmin } from "@/app/lib/config/supabaseServer";
import {
  ServiceError,
  validateImageFile,
  sanitizeFileExtension,
  extractPublicObjectPath,
  getAuthenticatedContext,
  getSupabaseServerClient,
} from "@/app/lib/services/submit-data-types/shared";

const normalizeArtistName = (name) =>
  name
    ? name
        .replace(/\s*\([^)]*\)/g, "")
        .trim()
        .toLowerCase()
    : "";

const EVENT_SELECT_LIMITED =
  "id, event_image, event_name, date, country, city, artists, event_type";

export async function getLimitedEvents({ limit = 15, offset = 0 } = {}) {
  const todayStr = getTodayDateOnlyString();

  const [eventsResult, likesResult] = await Promise.all([
    supabaseAdmin
      .from("events")
      .select(EVENT_SELECT_LIMITED)
      .eq("event_status", "upcoming")
      .gte("date", todayStr)
      .order("date", { ascending: true })
      .order("id", { ascending: true })
      .range(offset, offset + limit - 1),

    supabaseAdmin.from("event_likes").select("event_id"),
  ]);

  if (eventsResult.error)
    throw new ServiceError(eventsResult.error.message, 500);

  const events = eventsResult.data || [];
  const likesCountMap = {};
  (likesResult.data || []).forEach((like) => {
    likesCountMap[like.event_id] = (likesCountMap[like.event_id] || 0) + 1;
  });

  return events.map((event) => ({
    ...event,
    likesCount: likesCountMap[event.id] || 0,
  }));
}

export async function getUpcomingEvents(
  cookieStore,
  { limit = 7, userId = null } = {},
) {
  const supabase = await getSupabaseServerClient(cookieStore);
  const todayStr = getTodayDateOnlyString();
  const fetchLimit = Math.max(limit * 4, 40);

  const [eventsResult, likesResult, remindersResult] = await Promise.all([
    supabase
      .from("events")
      .select("*")
      .eq("status", "approved")
      .gte("date", todayStr)
      .order("date", { ascending: true })
      .limit(fetchLimit),

    supabase.from("event_likes").select("event_id, user_id"),

    userId
      ? supabase
          .from("event_reminders")
          .select("event_id, reminder_offset_days")
          .eq("user_id", userId)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (eventsResult.error) throw new ServiceError("Failed to fetch events", 500);

  const events = eventsResult.data || [];
  if (!events.length) return [];

  const eventIds = new Set(events.map((e) => e.id));
  const likesMap = {};
  const userLikesSet = new Set();
  const userRemindersSet = new Set(
    (remindersResult.data || []).map((r) => r.event_id),
  );
  const userReminderOffsetMap = new Map(
    (remindersResult.data || []).map((r) => [
      r.event_id,
      r.reminder_offset_days,
    ]),
  );

  (likesResult.data || []).forEach((like) => {
    if (!eventIds.has(like.event_id)) return;
    likesMap[like.event_id] = (likesMap[like.event_id] || 0) + 1;
    if (userId && like.user_id === userId) userLikesSet.add(like.event_id);
  });

  const enriched = events
    .map((event) => ({
      ...event,
      likesCount: likesMap[event.id] || 0,
      isLiked: userLikesSet.has(event.id),
      isReminderSet: userRemindersSet.has(event.id),
      reminderOffsetDays: userReminderOffsetMap.get(event.id) ?? null,
    }))
    .sort((a, b) => {
      const diff = new Date(a.date || 0) - new Date(b.date || 0);
      return diff !== 0 ? diff : (b.likesCount || 0) - (a.likesCount || 0);
    });

  return enriched.slice(0, limit);
}

export async function getEventById(cookieStore, id) {
  if (!id) throw new ServiceError("Event ID is required", 400);
  const supabase = await getSupabaseServerClient(cookieStore);

  let user = null;
  try {
    const result = await getServerUser(cookieStore);
    if (!result.error) user = result.user;
  } catch {
    /* unauthenticated */
  }

  const [eventResult, likesResult, reminderResult] = await Promise.all([
    supabase.from("events").select("*").eq("id", id).single(),
    supabase.from("event_likes").select("user_id").eq("event_id", id),
    user
      ? supabase
          .from("event_reminders")
          .select("id, reminder_offset_days")
          .eq("event_id", id)
          .eq("user_id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (eventResult.error || !eventResult.data) {
    throw new ServiceError(
      eventResult.error?.message || "Event not found",
      404,
    );
  }

  const event = eventResult.data;
  const likesData = likesResult.data || [];
  const likesCount = likesData.length;
  const userLiked = user ? likesData.some((l) => l.user_id === user.id) : false;
  const userReminderSet = Boolean(reminderResult?.data);
  const userReminderOffsetDays =
    reminderResult?.data?.reminder_offset_days ?? null;

  let artistsWithIds = [];
  if (event.artists?.length) {
    const { data: allArtists } = await supabase
      .from("artists")
      .select("id, name, stage_name, artist_slug");

    if (allArtists) {
      const artistMap = new Map();
      allArtists.forEach((a) => {
        if (a.name) artistMap.set(normalizeArtistName(a.name), a);
        if (a.stage_name) artistMap.set(normalizeArtistName(a.stage_name), a);
      });

      artistsWithIds = event.artists.map((artistName) => {
        const found = artistMap.get(normalizeArtistName(artistName));
        return found
          ? { name: artistName, id: found.id, artist_slug: found.artist_slug }
          : { name: artistName, id: null, artist_slug: null };
      });
    }
  }

  return {
    ...event,
    name: event.event_name,
    artists: artistsWithIds.length > 0 ? artistsWithIds : event.artists,
    likesCount,
    userLiked,
    userReminderSet,
    userReminderOffsetDays,
    currentUserId: user?.id ?? null,
    success: true,
  };
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

  const required = [
    "event_name",
    "event_type",
    "country",
    "city",
    "date",
    "promoter",
  ];
  const missing = required.filter((f) => !fields[f]?.trim());
  if (missing.length)
    throw new ServiceError(
      `Missing required fields: ${missing.join(", ")}`,
      400,
    );

  let artists = [];
  try {
    const entries = formData.getAll("artists");
    const json = entries.find((e) => {
      try {
        return typeof e === "string" && JSON.parse(e);
      } catch {
        return false;
      }
    });
    artists = json ? JSON.parse(json) : entries.filter((e) => e?.trim());
  } catch {
    artists = [];
  }
  if (!artists.length)
    throw new ServiceError("At least one artist is required", 400);

  const event_image = formData.get("event_image");
  let eventImageUrl = null;
  if (event_image instanceof File) {
    validateImageFile({ file: event_image, maxSize: 1 * 1024 * 1024 });
    const ext = sanitizeFileExtension(event_image.name);
    const fileName = `${fields.event_name
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "")}_${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("event_images")
      .upload(fileName, event_image, { cacheControl: "3600", upsert: false });
    if (uploadError) throw new ServiceError("Failed to upload image", 500);
    const { data } = supabase.storage
      .from("event_images")
      .getPublicUrl(fileName);
    eventImageUrl = data.publicUrl;
  }

  const { data: event, error: insertError } = await supabase
    .from("events")
    .insert({
      user_id: user.id,
      ...fields,
      artists,
      event_image: eventImageUrl,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (insertError) throw new ServiceError("Failed to create event", 500);

  // Attempt to link artist_schedule entries (best-effort)
  if (artists.length) {
    const { data: matched } = await supabase
      .from("artists")
      .select("id, name, stage_name")
      .or(
        artists.map((n) => `name.ilike.${n},stage_name.ilike.${n}`).join(","),
      );

    if (matched?.length) {
      await supabase.from("artist_schedule").insert(
        matched.map((a) => ({
          artist_id: a.id,
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
        })),
      );
    }
  }

  // Update user's submitted_event_id
  const { data: userData } = await supabase
    .from("users")
    .select("submitted_event_id")
    .eq("id", user.id)
    .single();
  if (userData) {
    await supabase
      .from("users")
      .update({
        submitted_event_id: [...(userData.submitted_event_id || []), event.id],
      })
      .eq("id", user.id);
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

  const { data: existing, error: checkError } = await supabase
    .from("events")
    .select("id, event_name, user_id, event_image")
    .eq("id", eventId)
    .maybeSingle();

  if (checkError) throw new ServiceError("Error checking event", 500);
  if (!existing)
    throw new ServiceError(`Event with ID ${eventId} not found`, 404);

  const updateFields = {};
  for (const [key, value] of formData.entries()) {
    if (key === "eventId" || key === "event_image" || !value) continue;
    updateFields[key] = ["artists", "links"].includes(key)
      ? (() => {
          try {
            return JSON.parse(value);
          } catch {
            return value;
          }
        })()
      : value;
  }

  const event_image = formData.get("event_image");
  if (event_image instanceof File && event_image.size > 0) {
    validateImageFile({
      file: event_image,
      maxSize: 1 * 1024 * 1024,
      required: false,
    });
    const oldPath = extractPublicObjectPath(
      existing.event_image,
      "event_images",
    );
    if (oldPath) await supabase.storage.from("event_images").remove([oldPath]);
    const ext = sanitizeFileExtension(event_image.name);
    const fileName = `event_${eventId}_${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("event_images")
      .upload(fileName, event_image, { cacheControl: "3600", upsert: true });
    if (uploadError) throw new ServiceError("Failed to upload image", 500);
    const { data } = supabase.storage
      .from("event_images")
      .getPublicUrl(fileName);
    updateFields.event_image = data.publicUrl;
  } else if (typeof event_image === "string" && event_image.trim()) {
    updateFields.event_image = event_image;
  }

  const { data: updated, error: updateError } = await supabase
    .from("events")
    .update(updateFields)
    .eq("id", eventId)
    .select()
    .single();
  if (updateError) throw new ServiceError("Failed to update event", 500);

  revalidateTag("events");
  revalidateTag(`user-statistics-${user.id}`);
  revalidateTag(`user-statistics-submitted-events-${user.id}`);
  revalidateTag("user-statistics-submitted-events");

  return {
    success: true,
    message: "Event updated successfully",
    data: updated,
  };
}

export async function deleteEvent(eventId, cookieStore) {
  if (!eventId) throw new ServiceError("Missing eventId", 400);
  const { user, supabase } = await getAuthenticatedContext(cookieStore);

  const { data: existing, error: checkError } = await supabase
    .from("events")
    .select("id, user_id, event_image")
    .eq("id", eventId)
    .maybeSingle();

  if (checkError) throw new ServiceError("Error checking event", 500);
  if (!existing) throw new ServiceError("Event not found", 404);

  const { data: profile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin && existing.user_id !== user.id) {
    throw new ServiceError("Unauthorized", 403);
  }

  const imagePath = extractPublicObjectPath(
    existing.event_image,
    "event_images",
  );
  if (imagePath)
    await supabase.storage.from("event_images").remove([imagePath]);

  const { error: deleteError } = await supabase
    .from("events")
    .delete()
    .eq("id", eventId);
  if (deleteError) throw new ServiceError("Failed to delete event", 500);

  revalidateTag("events");
  revalidateTag(`user-statistics-${user.id}`);
  revalidateTag(`user-statistics-submitted-events-${user.id}`);
  revalidateTag("user-statistics-submitted-events");

  return { success: true, message: "Event deleted successfully" };
}
