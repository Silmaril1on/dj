"use server";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";
import { getTodayDateOnlyString } from "@/app/helpers/utils";
import { parseLatLng } from "@/app/helpers/parseLocationUrl";
import { ServiceError } from "@/app/lib/services/shared";

const GLOBE_EDITION_FIELDS = `
  id,
  festival_id,
  start_date,
  end_date,
  status,
  festivals!inner(
    id,
    name,
    festival_slug,
    country,
    city,
    location_url,
    image_url,
    status
  )
`;

const LIMIT = 500;

/**
 * Returns upcoming approved festivals with parsed lat/lng for globe display.
 * Uses festival_editions for date filtering.
 */
export async function getGlobeFestivals() {
  const today = getTodayDateOnlyString();

  const { data, error } = await supabaseAdmin
    .from("festival_editions")
    .select(GLOBE_EDITION_FIELDS)
    .eq("status", "upcoming")
    .eq("festivals.status", "approved")
    .gte("start_date", today)
    .order("start_date", { ascending: true })
    .limit(LIMIT);

  if (error) throw new ServiceError(error.message, 500);

  const festivals = (data ?? [])
    .map((edition) => {
      const festival = edition.festivals;
      if (!festival) return null;

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
        start_date: edition.start_date,
        end_date: edition.end_date,
        edition_id: edition.id,
        edition_status: edition.status,
        image: imageSm,
        lat: coords.lat,
        lng: coords.lng,
      };
    })
    .filter(Boolean);

  return festivals;
}
