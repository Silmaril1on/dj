import { NextResponse } from "next/server";
import {
  createSupabaseServerClient,
  getServerUser,
  supabaseAdmin,
} from "@/app/lib/config/supabaseServer";
import { cookies } from "next/headers";

export async function POST(request) {
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

    const { artistId, rating } = await request.json();

    if (!artistId || !rating) {
      return NextResponse.json(
        { error: "Artist ID and rating are required" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient(cookieStore);

    // Check if user already rated this artist
    const { data: existingRating, error: checkError } = await supabase
      .from("artist_ratings")
      .select("id, score")
      .eq("artist_id", artistId)
      .eq("user_id", user.id)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      return NextResponse.json(
        { error: "Failed to check existing rating" },
        { status: 500 }
      );
    }

    // Insert or update rating in artist_ratings table
    let ratingError;
    if (existingRating) {
      // Update existing rating
      const { error } = await supabase
        .from("artist_ratings")
        .update({
          score: rating,
          username: user.userName,
        })
        .eq("artist_id", artistId)
        .eq("user_id", user.id);
      ratingError = error;
    } else {
      // Insert new rating
      const { error } = await supabase.from("artist_ratings").insert({
        artist_id: artistId,
        user_id: user.id,
        score: rating,
        username: user.userName,
      });
      ratingError = error;
    }

    if (ratingError) {
      return NextResponse.json(
        { error: "Failed to save rating" },
        { status: 500 }
      );
    }

    // We need to use admin client to bypass RLS and see all ratings for calculation
    const { data: allRatings, error: ratingsError } = await supabaseAdmin
      .from("artist_ratings")
      .select("score, user_id, username")
      .eq("artist_id", artistId);

    if (ratingsError) {
      return NextResponse.json(
        { error: "Failed to fetch ratings" },
        { status: 500 }
      );
    }

    // Calculate new statistics
    const totalRatings = allRatings.length;
    const sumOfRatings = allRatings.reduce((sum, r) => sum + r.score, 0);
    const averageScore = totalRatings > 0 ? sumOfRatings / totalRatings : 0;
    const metascore = Math.round(averageScore * 10); // Convert 8.5 to 85

    const newRatingStats = {
      average_score: parseFloat(averageScore.toFixed(1)),
      metascore,
      total_ratings: totalRatings,
    };

    // Update artist with new rating stats (remove ratings JSONB field)
    const { error: updateError } = await supabase
      .from("artists")
      .update({
        rating_stats: newRatingStats,
      })
      .eq("id", artistId);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update artist rating stats" },
        { status: 500 }
      );
    }
    // Verify the update by fetching the artist again
    const { data: updatedArtist, error: verifyError } = await supabase
      .from("artists")
      .select("rating_stats")
      .eq("id", artistId)
      .single();

    if (verifyError) {
      console.error("Error verifying update:", verifyError);
    } else {
      console.log(
        `Verification - Artist ${artistId} now has rating_stats:`,
        updatedArtist.rating_stats
      );
    }

    return NextResponse.json({
      success: true,
      message: "Rating submitted successfully",
      data: {
        rating_stats: newRatingStats,
        total_ratings: totalRatings,
      },
    });
  } catch (error) {
    console.error("Error in rating API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
