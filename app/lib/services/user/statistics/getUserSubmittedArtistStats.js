import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";
import { requireAuth } from "@/app/lib/services/user/requireAuth";

const getCachedSubmittedArtist = unstable_cache(
  async (userId, submittedArtistId) => {
    if (!submittedArtistId) return [];

    const { data, error } = await supabaseAdmin
      .from("artists")
      .select(
        "id, name, stage_name, artist_image, artist_slug, status, created_at, city, country",
      )
      .eq("id", submittedArtistId);

    if (error) throw new Error("Failed to fetch submitted artist profile");

    return data || [];
  },
  ["user-statistics", "submitted-artist"],
  {
    revalidate: 24 * 60 * 60,
    tags: ["user-statistics-submitted-artist"],
  },
);

export async function getUserSubmittedArtistStats() {
  const user = await requireAuth();
  return getCachedSubmittedArtist(user.id, user.submitted_artist_id || null);
}
