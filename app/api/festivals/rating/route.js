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

    const { festivalId, rating } = await request.json();
    if (!festivalId || !rating)
      return NextResponse.json(
        { error: "Festival ID and rating are required" },
        { status: 400 },
      );

    const supabase = await createSupabaseServerClient(cookieStore);

    const { data: existingRating, error: checkError } = await supabase
      .from("festival_ratings")
      .select("id, rating")
      .eq("festival_id", festivalId)
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
        .from("festival_ratings")
        .update({ rating })
        .eq("festival_id", festivalId)
        .eq("user_id", user.id);
      ratingError = error;
    } else {
      const { error } = await supabase
        .from("festival_ratings")
        .insert({ festival_id: festivalId, user_id: user.id, rating });
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
      .from("festival_ratings")
      .select("rating")
      .eq("festival_id", festivalId);

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

    const { error: updateError } = await supabase
      .from("festivals")
      .update({ rating_stats: newRatingStats })
      .eq("id", festivalId);
    if (updateError) {
      console.error("updateError:", updateError);
      return NextResponse.json(
        {
          error: "Failed to update festival rating stats",
          details: updateError.message,
          code: updateError.code,
        },
        { status: 500 },
      );
    }

    const { data: updatedFestival } = await supabase
      .from("festivals")
      .select("rating_stats, festival_slug")
      .eq("id", festivalId)
      .single();

    revalidateTag("festivals");
    if (updatedFestival?.festival_slug)
      revalidateTag(`festival-${updatedFestival.festival_slug}`);

    return NextResponse.json({
      success: true,
      message: "Rating submitted successfully",
      data: {
        rating_stats: newRatingStats,
        total_ratings: totalRatings,
      },
    });
  } catch (error) {
    console.error("Error in festival rating API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
