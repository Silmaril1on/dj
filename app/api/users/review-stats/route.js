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

    // Get total reviews count
    const { count: totalReviews, error: countError } = await supabase
      .from("artist_reviews")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (countError) {
      console.error("Error fetching reviews count:", countError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch reviews count",
          details: countError.message,
        },
        { status: 500 }
      );
    }

    // Get last 5 reviewed artists with their data
    const { data: recentReviews, error: reviewsError } = await supabase
      .from("artist_reviews")
      .select(
        `
        created_at,
        artists!inner(
          id,
          name,
          stage_name,
          artist_image
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (reviewsError) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch recent reviews",
          details: reviewsError.message,
        },
        { status: 500 }
      );
    }
    // Transform the data to include artist info
    const recentArtists =
      recentReviews?.map((review) => ({
        id: review.artists.id,
        name: review.artists.name,
        stage_name: review.artists.stage_name,
        artist_image: review.artists.artist_image,
        reviewed_at: review.created_at,
      })) || [];

    return NextResponse.json({
      success: true,
      data: {
        totalReviews: totalReviews || 0,
        recentArtists,
      },
    });
  } catch (error) {
    console.error("Error in review-stats API:", error);
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
