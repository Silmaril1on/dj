import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createSupabaseServerClient,
  getServerUser,
  supabaseAdmin,
} from "@/app/lib/config/supabaseServer";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const artistId = searchParams.get("id");
    const artistSlug = searchParams.get("slug");
    const userIdFromQuery = searchParams.get("userId");

    if (!artistId && !artistSlug) {
      return NextResponse.json(
        { error: "Artist ID or slug is required" },
        { status: 400 },
      );
    }

    const cookieStore = await cookies();
    const { user, error: userError } = await getServerUser(cookieStore);

    let userId = null;
    if (user && !userError) {
      userId = user.id;
    }

    // Use userId from query if available (fallback for debugging)
    if (userIdFromQuery && !userId) {
      userId = userIdFromQuery;
    }
    const supabase = await createSupabaseServerClient(cookieStore);

    let query = supabase.from("artists").select("*");

    if (artistSlug) {
      query = query.eq("artist_slug", artistSlug);
    } else {
      query = query.eq("id", artistId);
    }

    const { data: artist, error } = await query.single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch artist" },
        { status: 500 },
      );
    }

    if (!artist) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    // Use the fetched artist's id for subsequent queries
    const resolvedArtistId = artist.id;

    // Get likes count for the artist (this doesn't need RLS bypass as it's just counting)
    const { count: likesCount, error: countError } = await supabaseAdmin
      .from("artist_likes")
      .select("*", { count: "exact", head: true })
      .eq("artist_id", resolvedArtistId);

    if (countError) {
      return NextResponse.json(
        { error: "Failed to get likes count" },
        { status: 500 },
      );
    }

    // Get upcoming schedule count for the artist
    const { count: scheduleCount, error: scheduleCountError } =
      await supabaseAdmin
        .from("artist_schedule")
        .select("*", { count: "exact", head: true })
        .eq("artist_id", resolvedArtistId)
        .gte("date", new Date().toISOString().split("T")[0]);

    if (scheduleCountError) {
      console.error("Error fetching schedule count:", scheduleCountError);
      // Don't fail the entire request, just set count to 0
    }

    let isLiked = false;
    let userRating = null;
    let userSubmittedArtistId = null;

    // If user is authenticated, check if user liked this artist and get their rating
    if (userId) {
      const { data: userData, error: userDataError } = await supabaseAdmin
        .from("users")
        .select("id, submitted_artist_id")
        .eq("id", userId)
        .single();

      if (userDataError) {
        return NextResponse.json(
          { error: "Failed to check user data" },
          { status: 500 },
        );
      }

      userSubmittedArtistId = userData?.submitted_artist_id || null;

      const { data: userLike, error: userLikeError } = await supabaseAdmin
        .from("artist_likes")
        .select("id")
        .eq("artist_id", resolvedArtistId)
        .eq("user_id", userId)
        .single();

      if (userLikeError && userLikeError.code !== "PGRST116") {
        return NextResponse.json(
          { error: "Failed to check user like status" },
          { status: 500 },
        );
      }

      isLiked = !!userLike;
      const { data: userRatingData, error: userRatingError } =
        await supabaseAdmin
          .from("artist_ratings")
          .select("score")
          .eq("artist_id", resolvedArtistId)
          .eq("user_id", userId)
          .single();

      if (userRatingError && userRatingError.code !== "PGRST116") {
        return NextResponse.json(
          { error: "Failed to check user rating status" },
          { status: 500 },
        );
      }

      userRating = userRatingData?.score || null;
    }

    const responseData = {
      artist: {
        ...artist,
        likesCount: likesCount || 0,
        scheduleCount: scheduleCount || 0,
        isLiked,
        userRating,
        userSubmittedArtistId,
      },
    };

    return NextResponse.json(responseData);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
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
        { status: 401 },
      );
    }

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not authenticated",
        },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const artistId = searchParams.get("id");

    if (!artistId) {
      return NextResponse.json(
        { error: "Artist ID is required" },
        { status: 400 },
      );
    }

    const supabase = await createSupabaseServerClient(cookieStore);
    const body = await request.json();
    const { id, ...updateData } = body;

    // First check if artist exists
    const { data: existingArtist, error: fetchError } = await supabase
      .from("artists")
      .select("id")
      .eq("id", artistId)
      .single();

    if (fetchError || !existingArtist) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    // Update the artist
    const { data: updatedArtist, error: updateError } = await supabase
      .from("artists")
      .update(updateData)
      .eq("id", artistId)
      .select("*")
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update artist" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      artist: updatedArtist,
      message: "Artist updated successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
