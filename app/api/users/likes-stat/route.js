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
    // Get total likes count
    const { count: totalLikes, error: countError } = await supabase
      .from("artist_likes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (countError) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch likes count",
          details: countError.message,
        },
        { status: 500 }
      );
    }

    // Get last 5 liked artists with their data
    const { data: recentLikes, error: likesError } = await supabase
      .from("artist_likes")
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

    if (likesError) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch recent likes",
          details: likesError.message,
        },
        { status: 500 }
      );
    }

    // Transform the data to include artist info
    const recentArtists =
      recentLikes?.map((like) => ({
        id: like.artists.id,
        name: like.artists.name,
        stage_name: like.artists.stage_name,
        artist_image: like.artists.artist_image,
        liked_at: like.created_at,
      })) || [];

    return NextResponse.json({
      success: true,
      data: {
        totalLikes: totalLikes || 0,
        recentArtists,
      },
    });
  } catch (error) {
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
