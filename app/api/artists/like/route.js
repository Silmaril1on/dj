import { NextResponse } from "next/server";
import {
  createSupabaseServerClient,
  getServerUser,
} from "@/app/lib/config/supabaseServer";
import { cookies } from "next/headers";

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

    const cookieStore = await cookies();
    const { user, error: userError } = await getServerUser(cookieStore);

    // User authentication is optional for this route (public likes count)
    let userId = null;
    if (user && !userError) {
      userId = user.id;
    }

    const supabase = await createSupabaseServerClient(cookieStore);

    // Get likes count for the artist
    const { count: likesCount, error: countError } = await supabase
      .from("artist_likes")
      .select("*", { count: "exact", head: true })
      .eq("artist_id", artistId);

    if (countError) {
      console.error("Error getting likes count:", countError);
      return NextResponse.json(
        { error: "Failed to get likes count" },
        { status: 500 }
      );
    }

    let isLiked = false;

    // If user is authenticated, check if user liked this artist
    if (userId) {
      const { data: userLike, error: userLikeError } = await supabase
        .from("artist_likes")
        .select("id")
        .eq("artist_id", artistId)
        .eq("user_id", userId)
        .single();

      if (userLikeError && userLikeError.code !== "PGRST116") {
        console.error("Error checking user like:", userLikeError);
        return NextResponse.json(
          { error: "Failed to check user like status" },
          { status: 500 }
        );
      }

      isLiked = !!userLike;
    }

    return NextResponse.json({
      success: true,
      likesCount: likesCount || 0,
      isLiked,
    });
  } catch (error) {
    console.error("Error in GET likes API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    const { artistId } = await request.json();

    if (!artistId) {
      return NextResponse.json(
        { error: "Artist ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient(cookieStore);

    // Check if user already liked this artist
    const { data: existingLike, error: checkError } = await supabase
      .from("artist_likes")
      .select("id")
      .eq("artist_id", artistId)
      .eq("user_id", user.id)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 = no rows found
      console.error("Error checking existing like:", checkError);
      return NextResponse.json(
        { error: "Failed to check like status" },
        { status: 500 }
      );
    }

    const isLiked = !!existingLike;

    if (isLiked) {
      // Remove like
      const { error: deleteError } = await supabase
        .from("artist_likes")
        .delete()
        .eq("artist_id", artistId)
        .eq("user_id", user.id);

      if (deleteError) {
        console.error("Error removing like:", deleteError);
        return NextResponse.json(
          { error: "Failed to remove like" },
          { status: 500 }
        );
      }
    } else {
      // Add like
      const { error: insertError } = await supabase
        .from("artist_likes")
        .insert({
          artist_id: artistId,
          user_id: user.id,
        });

      if (insertError) {
        console.error("Error adding like:", insertError);
        return NextResponse.json(
          { error: "Failed to add like" },
          { status: 500 }
        );
      }
    }

    // Get updated likes count
    const { count: likesCount, error: countError } = await supabase
      .from("artist_likes")
      .select("*", { count: "exact", head: true })
      .eq("artist_id", artistId);

    if (countError) {
      console.error("Error getting likes count:", countError);
      return NextResponse.json(
        { error: "Failed to get likes count" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      likesCount: likesCount || 0,
      isLiked: !isLiked,
    });
  } catch (error) {
    console.error("Error in like API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
