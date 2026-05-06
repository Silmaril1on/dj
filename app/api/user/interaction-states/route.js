import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerUser } from "@/app/lib/config/supabaseServer";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";

/**
 * GET /api/user/interaction-states?type=clubs|festivals|artists
 *
 * Returns a lightweight map of the authenticated user's liked IDs and
 * ratings for a given entity type. Used by listing pages to hydrate
 * follow/rating button states without re-fetching the full item list.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (!["clubs", "festivals", "artists"].includes(type)) {
      return NextResponse.json({ liked: [], ratings: {} });
    }

    const cookieStore = await cookies();
    const { user } = await getServerUser(cookieStore);

    if (!user?.id) {
      return NextResponse.json({ liked: [], ratings: {} });
    }

    const userId = user.id;
    let liked = [];
    let ratings = {};

    if (type === "clubs") {
      const [likesRes, ratingsRes] = await Promise.all([
        supabaseAdmin
          .from("club_likes")
          .select("club_id")
          .eq("user_id", userId),
        supabaseAdmin
          .from("club_ratings")
          .select("club_id, rating")
          .eq("user_id", userId),
      ]);
      liked = (likesRes.data || []).map((r) => r.club_id);
      (ratingsRes.data || []).forEach((r) => {
        ratings[r.club_id] = r.rating;
      });
    } else if (type === "festivals") {
      const [likesRes, ratingsRes] = await Promise.all([
        supabaseAdmin
          .from("festival_likes")
          .select("festival_id")
          .eq("user_id", userId),
        supabaseAdmin
          .from("festival_ratings")
          .select("festival_id, rating")
          .eq("user_id", userId),
      ]);
      liked = (likesRes.data || []).map((r) => r.festival_id);
      (ratingsRes.data || []).forEach((r) => {
        ratings[r.festival_id] = r.rating;
      });
    } else if (type === "artists") {
      const [likesRes, ratingsRes] = await Promise.all([
        supabaseAdmin
          .from("artist_likes")
          .select("artist_id")
          .eq("user_id", userId),
        supabaseAdmin
          .from("artist_ratings")
          .select("artist_id, score")
          .eq("user_id", userId),
      ]);
      liked = (likesRes.data || []).map((r) => r.artist_id);
      (ratingsRes.data || []).forEach((r) => {
        ratings[r.artist_id] = r.score;
      });
    }

    return NextResponse.json({ liked, ratings });
  } catch (error) {
    console.error("[interaction-states]", error);
    return NextResponse.json({ liked: [], ratings: {} });
  }
}
