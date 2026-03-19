import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";
import { requireAuth } from "@/app/lib/services/user/requireAuth";

const getCachedActivityStats = unstable_cache(
  async (userId) => {
    const [
      { count: totalReviews },
      { count: totalRatings },
      { count: totalArtistLikes },
      { count: totalTrackedEvents },
      { count: totalEvents },
    ] = await Promise.all([
      supabaseAdmin
        .from("artist_reviews")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId),
      supabaseAdmin
        .from("artist_ratings")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId),
      supabaseAdmin
        .from("artist_likes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId),
      supabaseAdmin
        .from("event_likes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId),
      supabaseAdmin
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId),
    ]);

    return {
      totalReviews: totalReviews || 0,
      totalRatings: totalRatings || 0,
      totalArtistLikes: totalArtistLikes || 0,
      totalLikes: (totalArtistLikes || 0) + (totalTrackedEvents || 0),
      totalTrackedEvents: totalTrackedEvents || 0,
      totalEvents: totalEvents || 0,
    };
  },
  ["user-activity-stats"],
  {
    revalidate: 10 * 60,
    tags: ["user-activity-stats"],
  },
);

export async function getActivityStats() {
  const user = await requireAuth();
  return getCachedActivityStats(user.id);
}
