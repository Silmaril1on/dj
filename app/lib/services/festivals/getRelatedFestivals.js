"use server";
import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";

const LIMIT = 8;

export async function getRelatedFestivals(festivalId, country) {
  if (!festivalId || !country) return [];

  return unstable_cache(
    async () => {
      const { data, error } = await supabaseAdmin
        .from("festivals")
        .select("id, name, image_url, festival_slug, country, city")
        .eq("status", "approved")
        .eq("country", country)
        .neq("id", festivalId)
        .limit(LIMIT);

      if (error) throw new Error(error.message);
      return data || [];
    },
    [`related-festivals-${festivalId}-${country}`],
    {
      revalidate: 3600,
      tags: ["festivals", `related-festivals-${festivalId}`],
    },
  )();
}
