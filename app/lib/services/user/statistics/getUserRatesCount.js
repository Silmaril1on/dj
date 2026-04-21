import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";
import { requireAuth } from "@/app/lib/services/user/requireAuth";

const getCachedRatingsStats = unstable_cache(
  async (userId) => {
    const { data: ratings, error } = await supabaseAdmin
      .from("artist_ratings")
      .select(
        `
        score,
        created_at,
        artists!inner(
          id,
          name,
          stage_name,
          image_url,
          artist_slug
        )
      `,
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch ratings statistics:", error.message);
      return { totalRatings: 0, ratingData: [], ratedArtists: [] };
    }

    const totalRatings = ratings?.length || 0;
    const ratingCounts = Array(10).fill(0);

    ratings?.forEach(({ score }) => {
      if (score >= 1 && score <= 10) {
        ratingCounts[score - 1] += 1;
      }
    });

    const ratingData = ratingCounts
      .map((count, index) => ({
        rating: index + 1,
        count,
        percentage: totalRatings > 0 ? (count / totalRatings) * 100 : 0,
      }))
      .reverse();

    const ratedArtists =
      ratings?.map((item) => ({
        score: item.score,
        rated_at: item.created_at,
        artist: {
          id: item.artists.id,
          name: item.artists.name,
          stage_name: item.artists.stage_name,
          image_url: item.artists.image_url,
          artist_slug: item.artists.artist_slug,
        },
      })) || [];

    return { totalRatings, ratingData, ratedArtists };
  },
  ["user-statistics", "ratings"],
  {
    revalidate: 15 * 60,
    tags: ["user-statistics-ratings"],
  },
);

export async function getUserRatesCount() {
  const user = await requireAuth();
  return getCachedRatingsStats(user.id);
}
