import { NextResponse } from "next/server";
import {
  createSupabaseServerClient,
  getServerUser,
  supabaseAdmin,
} from "@/app/lib/config/supabaseServer";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const { user, error: userError } = await getServerUser(cookieStore);

    let userId = null;
    if (user && !userError) {
      userId = user.id;
    }

    const supabase = await createSupabaseServerClient(cookieStore);

    // ✅ OPTIMIZED: Fetch artists using RPC, then get aggregated likes/ratings in fewer queries
    const { data: artists, error: artistsError } = await supabase
      .rpc("get_random_artists", { limit_count: 18 })
      .select("id, name, stage_name, artist_image, country, city, rating_stats")
      .eq("status", "approved");

    if (artistsError) {
      return NextResponse.json(
        { error: artistsError.message },
        { status: 500 }
      );
    }

    if (!artists || artists.length === 0) {
      return NextResponse.json({ artists: [] });
    }

    const artistIds = artists.map((artist) => artist.id);

    // ✅ Get ALL likes and user-specific data in parallel
    const likesPromise = supabase
      .from("artist_likes")
      .select("artist_id, user_id")
      .in("artist_id", artistIds);

    const ratingsPromise = userId
      ? supabaseAdmin
          .from("artist_ratings")
          .select("artist_id, score")
          .eq("user_id", userId)
          .in("artist_id", artistIds)
      : Promise.resolve({ data: [], error: null });

    const [likesResult, ratingsResult] = await Promise.all([
      likesPromise,
      ratingsPromise,
    ]);

    if (likesResult.error) {
      console.error("Error fetching likes:", likesResult.error);
      return NextResponse.json(
        { error: likesResult.error.message },
        { status: 500 }
      );
    }

    if (ratingsResult.error) {
      console.error("Error fetching ratings:", ratingsResult.error);
      return NextResponse.json(
        { error: ratingsResult.error.message },
        { status: 500 }
      );
    }

    // Count total likes per artist AND track user's likes
    const likesCount = {};
    const userLikes = {};
    likesResult.data?.forEach((like) => {
      likesCount[like.artist_id] = (likesCount[like.artist_id] || 0) + 1;
      if (userId && like.user_id === userId) {
        userLikes[like.artist_id] = true;
      }
    });

    // Map user's ratings
    const userRatings = {};
    ratingsResult.data?.forEach((rating) => {
      userRatings[rating.artist_id] = rating.score;
    });

    // Combine all data
    const artistsWithLikes = artists.map((artist) => ({
      ...artist,
      likesCount: likesCount[artist.id] || 0,
      isLiked: userId ? !!userLikes[artist.id] : false,
      userRating: userId ? userRatings[artist.id] || null : null,
    }));

    return NextResponse.json({ artists: artistsWithLikes });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
