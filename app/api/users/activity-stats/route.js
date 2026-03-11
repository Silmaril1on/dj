import { NextResponse } from "next/server";
import {
  createSupabaseServerClient,
  getServerUser,
} from "@/app/lib/config/supabaseServer";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const { user, error: userError } = await getServerUser(cookieStore);

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: userError?.message || "User not authenticated",
        },
        { status: 401 },
      );
    }

    const supabase = await createSupabaseServerClient(cookieStore);

    // Fetch counts in parallel
    const [
      reviewsResult,
      ratingsResult,
      artistLikesResult,
      eventLikesResult,
      eventsResult,
    ] = await Promise.all([
      supabase
        .from("artist_reviews")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("artist_ratings")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("artist_likes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("event_likes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]);

    // ✅ Add revalidation (10 minutes = 600 seconds)
    return NextResponse.json(
      {
        success: true,
        data: {
          totalReviews: reviewsResult.count || 0,
          totalRatings: ratingsResult.count || 0,
          totalLikes:
            (artistLikesResult.count || 0) + (eventLikesResult.count || 0),
          totalEvents: eventsResult.count || 0,
        },
      },
      {
        status: 200,
        revalidate: 600,
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
