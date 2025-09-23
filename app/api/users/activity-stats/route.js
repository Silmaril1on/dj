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

    if (userError) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication failed",
          details: userError.message,
        },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not authenticated",
        },
        { status: 401 }
      );
    }

    const supabase = await createSupabaseServerClient(cookieStore);

    // Fetch all counts in parallel
    const [reviewsResult, ratingsResult, likesResult] = await Promise.all([
      // Get total reviews count
      supabase
        .from("artist_reviews")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),

      // Get total ratings count
      supabase
        .from("artist_ratings")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),

      // Get total likes count
      supabase
        .from("artist_likes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]);

    // Check for errors
    if (reviewsResult.error) {
      console.error("Error fetching reviews count:", reviewsResult.error);
    }
    if (ratingsResult.error) {
      console.error("Error fetching ratings count:", ratingsResult.error);
    }
    if (likesResult.error) {
      console.error("Error fetching likes count:", likesResult.error);
    }

    return NextResponse.json({
      success: true,
      data: {
        totalReviews: reviewsResult.count || 0,
        totalRatings: ratingsResult.count || 0,
        totalLikes: likesResult.count || 0,
      },
    });
  } catch (error) {
    console.error("Error in activity-stats API:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
