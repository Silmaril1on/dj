import { supabaseAdmin } from "@/app/lib/config/supabaseServer";
import { requireAuth } from "@/app/lib/services/user/requireAuth";

export async function getUserHasAnyStats() {
  try {
    const user = await requireAuth();
    const userId = user.id;

    // Check user-level submission IDs (no extra query needed)
    if (
      user.submitted_artist_id ||
      user.submitted_club_id ||
      user.submitted_festival_id
    ) {
      return true;
    }

    // Check activity tables in parallel
    const [ratings, reviews, likes, bookings, events] = await Promise.all([
      supabaseAdmin
        .from("artist_ratings")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId),
      supabaseAdmin
        .from("artist_reviews")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId),
      supabaseAdmin
        .from("artist_likes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId),
      supabaseAdmin
        .from("booking_requests")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", userId),
      supabaseAdmin
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId),
    ]);

    return (
      (ratings.count ?? 0) > 0 ||
      (reviews.count ?? 0) > 0 ||
      (likes.count ?? 0) > 0 ||
      (bookings.count ?? 0) > 0 ||
      (events.count ?? 0) > 0
    );
  } catch {
    return false;
  }
}
