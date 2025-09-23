import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const artistId = searchParams.get("artistId");

    if (!artistId) {
      return NextResponse.json(
        { error: "Artist ID is required" },
        { status: 400 }
      );
    }

    // Get all ratings for this artist
    const { data: ratings, error: ratingsError } = await supabaseAdmin
      .from("artist_ratings")
      .select("score")
      .eq("artist_id", artistId);

    if (ratingsError) {
      console.error("Error fetching artist ratings:", ratingsError);
      return NextResponse.json(
        { error: "Failed to fetch artist ratings" },
        { status: 500 }
      );
    }

    if (!ratings || ratings.length === 0) {
      return NextResponse.json({
        ratingData: [],
        totalRatings: 0,
      });
    }

    // Calculate rating distribution
    const ratingCounts = {};
    const totalRatings = ratings.length;

    // Initialize all possible ratings (1-10) with 0
    for (let i = 1; i <= 10; i++) {
      ratingCounts[i] = 0;
    }

    // Count each rating
    ratings.forEach(({ score }) => {
      if (score >= 1 && score <= 10) {
        ratingCounts[score]++;
      }
    });

    // Convert to array with percentages
    const ratingData = Object.entries(ratingCounts)
      .map(([rating, count]) => ({
        rating: parseInt(rating),
        count,
        percentage: totalRatings > 0 ? (count / totalRatings) * 100 : 0,
      }))
      .sort((a, b) => b.rating - a.rating); // Sort by rating descending (10 to 1)

    return NextResponse.json({
      ratingData,
      totalRatings,
    });
  } catch (error) {
    console.error("Error in artist rating insights API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
