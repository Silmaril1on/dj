import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerUser, supabaseAdmin } from "@/app/lib/config/supabaseServer";

export async function GET(request) {
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

    // Use admin client to bypass RLS for fetching user's ratings
    const { data: ratings, error: ratingsError } = await supabaseAdmin
      .from("artist_ratings")
      .select("score")
      .eq("user_id", user.id);

    if (ratingsError) {
      console.error("Error fetching ratings:", ratingsError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch ratings",
          details: ratingsError.message,
        },
        { status: 500 }
      );
    }

    // Calculate statistics
    const ratingCounts = Array(10).fill(0);
    ratings.forEach(({ score }) => {
      if (score >= 1 && score <= 10) {
        ratingCounts[score - 1] += 1;
      }
    });

    const totalRatings = ratings.length || 1;
    const ratingData = ratingCounts
      .map((count, index) => ({
        rating: index + 1,
        count,
        percentage: (count / totalRatings) * 100,
      }))
      .reverse();

    return NextResponse.json({
      success: true,
      data: {
        ratedArtists: ratings,
        ratingData,
        totalRatings,
      },
    });
  } catch (error) {
    console.error("Error in recent-rates API:", error);
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
