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

    // User authentication is optional for this route (public artists list)
    let userId = null;
    if (user && !userError) {
      userId = user.id;
    }

    const supabase = await createSupabaseServerClient(cookieStore);

    // Get all artists
    const { data: artists, error: artistsError } = await supabase
      .from("artists")
      .select("id, name, stage_name, artist_image, country, city, rating_stats")
      .eq("status", "approved")
      .limit(16);

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

    // Get likes count for each artist
    const { data: likesData, error: likesError } = await supabase
      .from("artist_likes")
      .select("artist_id")
      .in("artist_id", artistIds);

    if (likesError) {
      return NextResponse.json({ error: likesError.message }, { status: 500 });
    }

    // Count likes for each artist
    const likesCount = {};
    likesData?.forEach((like) => {
      likesCount[like.artist_id] = (likesCount[like.artist_id] || 0) + 1;
    });

    // Get user's likes if user is authenticated
    let userLikes = {};
    if (userId) {
      const { data: userLikesData, error: userLikesError } = await supabaseAdmin
        .from("artist_likes")
        .select("artist_id")
        .eq("user_id", userId)
        .in("artist_id", artistIds);

      if (userLikesError) {
        console.error("Error fetching user likes:", userLikesError);
        return NextResponse.json(
          { error: userLikesError.message },
          { status: 500 }
        );
      }

      // Create a set of artist IDs that the user has liked
      userLikesData?.forEach((like) => {
        userLikes[like.artist_id] = true;
      });
    }

    // Get user's ratings if user is authenticated
    let userRatings = {};
    if (userId) {
      const { data: userRatingsData, error: userRatingsError } =
        await supabaseAdmin
          .from("artist_ratings")
          .select("artist_id, score")
          .eq("user_id", userId)
          .in("artist_id", artistIds);

      if (userRatingsError) {
        return NextResponse.json(
          { error: userRatingsError.message },
          { status: 500 }
        );
      }

      // Create a map of artist IDs to user's rating scores
      userRatingsData?.forEach((rating) => {
        userRatings[rating.artist_id] = rating.score;
      });
    }

    // Add likes count, user's like status, and user's rating to each artist
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
