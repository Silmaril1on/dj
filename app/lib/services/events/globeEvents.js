"use server";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";
import { getTodayDateOnlyString } from "@/app/helpers/utils";
import { parseLatLng } from "@/app/helpers/parseLocationUrl";
import { ServiceError } from "@/app/lib/services/shared";

const GLOBE_EVENT_FIELDS = [
  "id",
  "event_slug",
  "country",
  "city",
  "venue_name",
  "event_type",
  "date",
  "location_url",
  "image_url",
  "artists",
].join(", ");

const INITIAL_LIMIT = 500;

/**
 * Returns upcoming approved events with parsed lat/lng for globe display.
 * Artists trimmed to first 5 entries, only sm image_url exposed.
 */
export async function getGlobeEvents() {
  const today = getTodayDateOnlyString();

  const { data, error } = await supabaseAdmin
    .from("events")
    .select(GLOBE_EVENT_FIELDS)
    .eq("status", "approved")
    .gte("date", today)
    .order("date", { ascending: true })
    .limit(INITIAL_LIMIT);

  if (error) throw new ServiceError(error.message, 500);

  const events = (data ?? [])
    .map((event) => {
      const coords = parseLatLng(event.location_url);
      if (!coords) return null;

      // Keep only the first 5 artists with sm image
      const artists = Array.isArray(event.artists)
        ? event.artists.slice(0, 5).map((a) => ({
            name: a.name ?? a.stage_name ?? "",
            image:
              typeof a.image_url === "object"
                ? (a.image_url?.sm ?? null)
                : (a.image_url ?? null),
          }))
        : [];

      return {
        id: event.id,
        slug: event.event_slug,
        country: event.country,
        city: event.city,
        venue: event.venue_name,
        type: event.event_type,
        date: event.date,
        image:
          typeof event.image_url === "object"
            ? (event.image_url?.sm ?? null)
            : (event.image_url ?? null),
        artists,
        lat: coords.lat,
        lng: coords.lng,
      };
    })
    .filter(Boolean);

  return events;
}
