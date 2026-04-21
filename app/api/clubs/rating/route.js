import { NextResponse } from "next/server";
import {
  createSupabaseServerClient,
  getServerUser,
  supabaseAdmin,
} from "@/app/lib/config/supabaseServer";
import { cookies } from "next/headers";
import { revalidateTag } from "next/cache";

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const { user, error: userError } = await getServerUser(cookieStore);

    if (userError)
      return NextResponse.json(
        { success: false, error: "Authentication failed" },
        { status: 401 },
      );
    if (!user)
      return NextResponse.json(
        { success: false, error: "User not authenticated" },
        { status: 401 },
      );

    const { clubId, rating } = await request.json();
    if (!clubId || !rating)
      return NextResponse.json(
        { error: "Club ID and rating are required" },
        { status: 400 },
      );

    const supabase = await createSupabaseServerClient(cookieStore);

    const { data: existingRating, error: checkError } = await supabase
      .from("club_ratings")
      .select("id, rating")
      .eq("club_id", clubId)
      .eq("user_id", user.id)
      .single();

    if (checkError && checkError.code !== "PGRST116")
      return NextResponse.json(
        {
          error: "Failed to check existing rating",
          details: checkError.message,
          code: checkError.code,
        },
        { status: 500 },
      );

    let ratingError;
    if (existingRating) {
      const { error } = await supabase
        .from("club_ratings")
        .update({ rating })
        .eq("club_id", clubId)
        .eq("user_id", user.id);
      ratingError = error;
    } else {
      const { error } = await supabase
        .from("club_ratings")
        .insert({ club_id: clubId, user_id: user.id, rating });
      ratingError = error;
    }

    if (ratingError) {
      console.error("ratingError:", ratingError);
      return NextResponse.json(
        {
          error: "Failed to save rating",
          details: ratingError.message,
          code: ratingError.code,
        },
        { status: 500 },
      );
    }

    const { data: allRatings, error: ratingsError } = await supabaseAdmin
      .from("club_ratings")
      .select("rating")
      .eq("club_id", clubId);

    if (ratingsError) {
      console.error("ratingsError:", ratingsError);
      return NextResponse.json(
        { error: "Failed to fetch ratings", details: ratingsError.message },
        { status: 500 },
      );
    }

    const totalRatings = allRatings.length;
    const averageScore =
      totalRatings > 0
        ? allRatings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
        : 0;
    const newRatingStats = {
      average_score: parseFloat(averageScore.toFixed(1)),
      metascore: Math.round(averageScore * 10),
      total_ratings: totalRatings,
    };

    const { error: updateError } = await supabaseAdmin
      .from("clubs")
      .update({ rating_stats: newRatingStats })
      .eq("id", clubId);
    if (updateError) {
      console.error("updateError:", updateError);
      return NextResponse.json(
        {
          error: "Failed to update club rating stats",
          details: updateError.message,
          code: updateError.code,
        },
        { status: 500 },
      );
    }

    const { data: updatedClub } = await supabaseAdmin
      .from("clubs")
      .select("rating_stats, club_slug")
      .eq("id", clubId)
      .single();

    revalidateTag("clubs");
    if (updatedClub?.club_slug) revalidateTag(`club-${updatedClub.club_slug}`);

    return NextResponse.json({
      success: true,
      message: "Rating submitted successfully",
      data: {
        rating_stats: newRatingStats,
        total_ratings: totalRatings,
      },
    });
  } catch (error) {
    console.error("Error in club rating API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
