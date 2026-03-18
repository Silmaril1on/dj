"use server";

import { supabaseAdmin } from "@/app/lib/config/supabaseServer";

// Not cached — result is per-user, always fresh.
// Runs both queries in parallel to minimise latency.
export async function getArtistUserData(artistId, userId) {
  const [likeResult, ratingResult] = await Promise.all([
    supabaseAdmin
      .from("artist_likes")
      .select("id")
      .eq("artist_id", artistId)
      .eq("user_id", userId)
      .maybeSingle(),

    supabaseAdmin
      .from("artist_ratings")
      .select("score")
      .eq("artist_id", artistId)
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (likeResult.error) throw new Error(likeResult.error.message);
  if (ratingResult.error) throw new Error(ratingResult.error.message);

  return {
    isLiked: !!likeResult.data,
    userRating: ratingResult.data?.score ?? null,
  };
}
