"use server";
import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";

const LIMIT = 8;

export async function getRelatedClubs(clubId, country) {
  if (!clubId || !country) return [];

  return unstable_cache(
    async () => {
      const { data, error } = await supabaseAdmin
        .from("clubs")
        .select("id, name, image_url, club_slug, country, city")
        .eq("status", "approved")
        .eq("country", country)
        .neq("id", clubId)
        .limit(LIMIT);

      if (error) throw new Error(error.message);
      return data || [];
    },
    [`related-clubs-${clubId}-${country}`],
    { revalidate: 3600, tags: ["clubs", `related-clubs-${clubId}`] },
  )();
}
