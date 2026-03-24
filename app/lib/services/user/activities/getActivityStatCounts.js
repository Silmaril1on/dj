import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";
import { requireAuth } from "@/app/lib/services/user/requireAuth";

const getCachedActivityStatCounts = unstable_cache(
  async (userId, submittedEventIds) => {
    const [
      { count: totalReviews },
      { count: totalRatings },
      { count: totalTrackedEvents },
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
        .from("event_likes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId),
    ]);

    return {
      totalReviews: totalReviews || 0,
      totalRatings: totalRatings || 0,
      totalTrackedEvents: totalTrackedEvents || 0,
      totalSubmittedEvents: Array.isArray(submittedEventIds)
        ? submittedEventIds.length
        : 0,
    };
  },
  ["user-activity-stat-counts"],
  {
    revalidate: 60,
    tags: ["user-activity-stat-counts"],
  },
);

export async function getActivityStatCounts() {
  const user = await requireAuth();
  return getCachedActivityStatCounts(user.id, user.submitted_event_id || []);
}
