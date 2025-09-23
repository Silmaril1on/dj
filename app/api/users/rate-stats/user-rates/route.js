import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createSupabaseServerClient,
  getServerUser,
} from "@/app/lib/config/supabaseServer";

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

    const supabase = await createSupabaseServerClient(cookieStore);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const offset = (page - 1) * limit;

    // Get all user ratings with pagination
    const { data: userRatings, error: ratingsError } = await supabase
      .from("artist_ratings")
      .select(
        `
        id,
        score,
        created_at,
        artists!inner(
          id,
          name,
          stage_name,
          artist_image,
          country,
          city
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (ratingsError) {
      console.error("Error fetching user ratings:", ratingsError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch user ratings",
          details: ratingsError.message,
        },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count: totalRatings, error: countError } = await supabase
      .from("artist_ratings")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (countError) {
      console.error("Error fetching ratings count:", countError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch ratings count",
          details: countError.message,
        },
        { status: 500 }
      );
    }

    // Transform the data to include artist info
    const ratings =
      userRatings?.map((rating) => ({
        id: rating.id,
        score: rating.score,
        created_at: rating.created_at,
        artist: {
          id: rating.artists.id,
          name: rating.artists.name,
          stage_name: rating.artists.stage_name,
          artist_image: rating.artists.artist_image,
          country: rating.artists.country,
          city: rating.artists.city,
        },
      })) || [];

    return NextResponse.json({
      success: true,
      data: {
        ratings,
        pagination: {
          page,
          limit,
          total: totalRatings || 0,
          totalPages: Math.ceil((totalRatings || 0) / limit),
          hasNext: page < Math.ceil((totalRatings || 0) / limit),
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error in user-rates API:", error);
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
