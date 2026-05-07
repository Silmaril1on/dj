"use server";
import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";

const LIMIT = 8;

export async function getRelatedEvents(eventId, country) {
  if (!eventId || !country) return [];

  const today = new Date().toISOString().split("T")[0];

  return unstable_cache(
    async () => {
      const { data, error } = await supabaseAdmin
        .from("events")
        .select(
          "id, event_name, image_url, country, city, date, event_slug, venue_name",
        )
        .eq("status", "approved")
        .eq("country", country)
        .neq("id", eventId)
        .gte("date", today)
        .order("date", { ascending: true })
        .limit(LIMIT);

      if (error) throw new Error(error.message);
      return data || [];
    },
    [`related-events-${eventId}-${country}-${today}`],
    { revalidate: 3600, tags: ["events", `related-events-${eventId}`] },
  )();
}
