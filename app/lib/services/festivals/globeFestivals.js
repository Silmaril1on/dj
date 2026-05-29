"use server";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";
import { getTodayDateOnlyString } from "@/app/helpers/utils";
import { parseLatLng } from "@/app/helpers/parseLocationUrl";
import { ServiceError } from "@/app/lib/services/shared";

const GLOBE_FESTIVAL_FIELDS = [
  "id",
  "name",
  "festival_slug",
  "country",
  "city",
  "start_date",
  "end_date",
  "location_url",
  "image_url",
].join(", ");

const LIMIT = 500;

/**
 * Returns upcoming approved festivals with parsed lat/lng for globe display.
 * Only festivals with a known start_date (upcoming) are included.
 */
export async function getGlobeFestivals() {
  const today = getTodayDateOnlyString();

  const { data, error } = await supabaseAdmin
    .from("festivals")
    .select(GLOBE_FESTIVAL_FIELDS)
    .eq("status", "approved")
    .gte("start_date", today)
    .order("start_date", { ascending: true })
    .limit(LIMIT);

  if (error) throw new ServiceError(error.message, 500);

  const festivals = (data ?? [])
    .map((festival) => {
      const coords = parseLatLng(festival.location_url);
      if (!coords) return null;

      const imageSm =
        typeof festival.image_url === "object"
          ? (festival.image_url?.sm ?? null)
          : (festival.image_url ?? null);

      return {
        id: festival.id,
        name: festival.name,
        slug: festival.festival_slug,
        country: festival.country,
        city: festival.city,
        start_date: festival.start_date,
        end_date: festival.end_date,
        image: imageSm,
        lat: coords.lat,
        lng: coords.lng,
      };
    })
    .filter(Boolean);

  return festivals;
}
