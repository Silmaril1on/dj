import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/lib/config/supabaseServer";
import { cookies } from "next/headers";

export async function GET(request, { params }) {
  try {
    const { id: artistId } = await params;

    if (!artistId) {
      return NextResponse.json(
        { error: "Artist ID is required" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);

    // Fetch rating insights for this artist
    const { data: ratingsData, error: ratingsError } = await supabase
      .from("artist_ratings")
      .select("score")
      .eq("artist_id", artistId);

    if (ratingsError) {
      console.error("Error fetching ratings:", ratingsError);
      return NextResponse.json(
        { error: "Failed to fetch rating insights" },
        { status: 500 }
      );
    }

    if (!ratingsData || ratingsData.length === 0) {
      return NextResponse.json({
        totalRatings: 0,
        averageRating: 0,
        ratingData: [],
      });
    }

    // Calculate rating distribution
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 };
    let totalScore = 0;

    ratingsData.forEach((rating) => {
      const score = rating.score;
      if (score >= 1 && score <= 10) {
        ratingCounts[score]++;
        totalScore += score;
      }
    });

    const totalRatings = ratingsData.length;
    const averageRating = totalRatings > 0 ? totalScore / totalRatings : 0;

    const ratingData = Object.entries(ratingCounts)
      .map(([rating, count]) => ({
        rating: parseInt(rating),
        count,
        percentage: totalRatings > 0 ? (count / totalRatings) * 100 : 0,
      }))
      .sort((a, b) => b.rating - a.rating);

    return NextResponse.json({
      totalRatings,
      averageRating: parseFloat(averageRating.toFixed(2)),
      ratingData,
    });
  } catch (error) {
    console.error("Insights API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
