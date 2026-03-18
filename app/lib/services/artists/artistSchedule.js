"use server";
import { unstable_cache, revalidateTag } from "next/cache";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";

const isUuid = (value) =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );

function invalidateScheduleCache(artistId) {
  revalidateTag(`artist-schedule-${artistId}`);
  revalidateTag("artist-schedule");
}

export async function getArtistScheduleCount(artistId) {
  return unstable_cache(
    async () => {
      const today = new Date().toISOString().split("T")[0];
      const { count, error } = await supabaseAdmin
        .from("artist_schedule")
        .select("*", { count: "exact", head: true })
        .eq("artist_id", artistId)
        .gte("date", today);

      if (error) throw new Error(error.message);
      return count || 0;
    },
    ["artist-schedule-count", artistId],
    {
      revalidate: 300,
      tags: ["artist-schedule", `artist-schedule-${artistId}`],
    },
  )();
}

export async function getArtistSchedules(artistId) {
  const { data, error } = await supabaseAdmin
    .from("artist_schedule")
    .select("*")
    .eq("artist_id", artistId)
    .order("date", { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function createArtistSchedules(artistId, events) {
  if (!Array.isArray(events) || events.length === 0) {
    throw new Error("Events array is required");
  }

  const inserted = [];
  const errors = [];

  for (const event of events) {
    try {
      let artistIdToUse = artistId || event.artistId || null;

      if (!artistIdToUse)
        throw new Error("Artist ID is missing for this event");

      // Resolve non-UUID artist ID by name lookup
      if (!isUuid(artistIdToUse)) {
        const lookupName = event.artistName || event.name || null;
        if (!lookupName)
          throw new Error(
            "Artist ID is not a UUID and no artist name to resolve",
          );

        const { data: matched, error: lookupError } = await supabaseAdmin
          .from("artists")
          .select("id")
          .or(`name.ilike.%${lookupName}%,stage_name.ilike.%${lookupName}%`)
          .limit(1)
          .maybeSingle();

        if (lookupError) throw new Error(lookupError.message);
        if (!matched?.id)
          throw new Error(`No matching artist found for "${lookupName}"`);
        artistIdToUse = matched.id;
      }

      let date,
        time,
        country,
        city,
        clubName,
        eventLink,
        eventType,
        eventTitle,
        eventLocation;

      // Bandsintown format
      if (event.startsAt) {
        date = event.startsAt.split("T")[0];
        time = event.startTime
          ? event.startTime.replace(/\s*GMT[+-]?\d+/, "").trim()
          : null;
        if (event.venueCity) {
          const parts = event.venueCity.split(",").map((p) => p.trim());
          city = parts[0] || null;
          country = parts[1] || null;
        }
        clubName = event.venueName || null;
        eventLink = event.url || null;
        eventType = event.eventType || null;
        eventTitle = event.title || null;
        if (event.lat != null && event.lon != null) {
          eventLocation = `https://www.google.com/maps?q=${event.lat},${event.lon}`;
        }
      }
      // RA format
      else if (
        event.date &&
        (event.venue || event.contentUrl || event.isFestival)
      ) {
        date = event.date.split("T")[0];
        time = event.startTime || null;
        country = event.venue?.area?.country?.name || null;
        city = event.venue?.area?.name || null;
        if (!city || city.toLowerCase() === "all") city = "Not specified";
        clubName = event.venue?.name || null;
        eventLink = event.contentUrl
          ? `https://ra.co${event.contentUrl}`
          : null;
        eventType = event.isFestival ? "festival" : "event";
        eventTitle = event.title || null;
      }
      // Manual form format from app modal
      else if (event.date) {
        date = String(event.date).split("T")[0];
        time = event.time || null;
        country = event.country || null;
        city = event.city || null;
        clubName = event.club_name || null;
        eventLink = event.event_link || null;
        eventType = event.event_type || null;
        eventTitle = event.event_title || null;
        eventLocation = event.event_location || null;
      }

      const scheduleData = {
        artist_id: artistIdToUse,
        date,
        time,
        country,
        city,
        club_name: clubName,
        event_link: eventLink,
        event_title: eventTitle,
        event_location: eventLocation || null,
        event_type: eventType || null,
        event_status:
          date && new Date(date) < new Date(new Date().toDateString())
            ? "past"
            : "upcoming",
      };

      const { data: insertedData, error: insertError } = await supabaseAdmin
        .from("artist_schedule")
        .insert(scheduleData)
        .select()
        .single();

      if (insertError) {
        errors.push({
          event: event.title || event.url,
          error: insertError.message,
        });
      } else {
        inserted.push(insertedData);
        invalidateScheduleCache(artistIdToUse);
      }
    } catch (err) {
      errors.push({ event: event.title || event.url, error: err.message });
    }
  }

  return { inserted, errors, total: events.length };
}

export async function updateArtistSchedule(scheduleId, updateData, user) {
  // Fetch schedule to verify existence and check permissions
  const { data: scheduleEvent, error: fetchError } = await supabaseAdmin
    .from("artist_schedule")
    .select("*, artists!inner(id)")
    .eq("id", scheduleId)
    .single();

  if (fetchError || !scheduleEvent) throw new Error("Schedule event not found");

  const isAdmin = user.is_admin;
  const isOwner = user.submitted_artist_id === scheduleEvent.artist_id;

  if (!isAdmin && !isOwner) throw new Error("Permission denied");

  const validEventTypes = ["event", "festival", "club", "concert"];
  const normalizedEventType =
    typeof updateData.event_type === "string" &&
    validEventTypes.includes(updateData.event_type)
      ? updateData.event_type
      : null;

  if (
    !updateData.date ||
    !updateData.time ||
    !updateData.country ||
    !updateData.club_name
  ) {
    throw new Error("Missing required fields: date, time, country, club_name");
  }

  const eventUpdate = {
    date: updateData.date,
    time: updateData.time,
    country: updateData.country,
    city: updateData.city || null,
    club_name: updateData.club_name,
    event_link: updateData.event_link || null,
    event_title: updateData.event_title || null,
    event_type: normalizedEventType,
    event_status: scheduleEvent.event_status || "upcoming",
    event_location: updateData.event_location || null,
    updated_at: new Date().toISOString(),
  };

  const { data: updated, error: updateError } = await supabaseAdmin
    .from("artist_schedule")
    .update(eventUpdate)
    .eq("id", scheduleId)
    .select()
    .single();

  if (updateError) throw new Error(updateError.message);

  invalidateScheduleCache(scheduleEvent.artist_id);
  return updated;
}

export async function deleteArtistSchedule(scheduleId, user) {
  const { data: scheduleEvent, error: fetchError } = await supabaseAdmin
    .from("artist_schedule")
    .select("artist_id, artists!inner(id)")
    .eq("id", scheduleId)
    .single();

  if (fetchError || !scheduleEvent) throw new Error("Schedule event not found");

  const isAdmin = user.is_admin;
  const isOwner = user.submitted_artist_id === scheduleEvent.artist_id;

  if (!isAdmin && !isOwner) throw new Error("Permission denied");

  const { error: deleteError } = await supabaseAdmin
    .from("artist_schedule")
    .delete()
    .eq("id", scheduleId);

  if (deleteError) throw new Error(deleteError.message);

  invalidateScheduleCache(scheduleEvent.artist_id);
}
