import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";
import { requireAuth } from "@/app/lib/services/user/requireAuth";

const getCachedReviewsStats = unstable_cache(
  async (userId) => {
    const [
      { count: totalReviews, error: reviewsCountError },
      { data: recentReviews, error: recentReviewsError },
    ] = await Promise.all([
      supabaseAdmin
        .from("artist_reviews")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId),
      supabaseAdmin
        .from("artist_reviews")
        .select(
          `
          created_at,
          artists!inner(
            id,
            name,
            stage_name,
            artist_image,
            artist_slug
          )
        `,
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    if (reviewsCountError) throw new Error("Failed to fetch reviews count");
    if (recentReviewsError)
      throw new Error("Failed to fetch recent reviewed artists");

    const recentArtists =
      recentReviews?.map((review) => ({
        id: review.artists.id,
        name: review.artists.name,
        stage_name: review.artists.stage_name,
        artist_image: review.artists.artist_image,
        artist_slug: review.artists.artist_slug,
        reviewed_at: review.created_at,
      })) || [];

    return { totalReviews: totalReviews || 0, recentArtists };
  },
  ["user-statistics", "reviews"],
  {
    revalidate: 15 * 60,
    tags: ["user-statistics-reviews"],
  },
);

export async function getUserReviewsCount() {
  const user = await requireAuth();
  return getCachedReviewsStats(user.id);
}
