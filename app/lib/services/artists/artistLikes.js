"use server";
import { unstable_cache, revalidateTag } from "next/cache";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";
import {
  getAuthenticatedContext,
  getSupabaseServerClient,
} from "@/app/lib/services/submit-data-types/shared";

// Cache tag: `artist-likes-${artistId}` — revalidate from like/route.js on toggle.
export async function getArtistLikesCount(artistId) {
  return unstable_cache(
    async () => {
      const { count, error } = await supabaseAdmin
        .from("artist_likes")
        .select("*", { count: "exact", head: true })
        .eq("artist_id", artistId);

      if (error) throw new Error(error.message);
      return count || 0;
    },
    ["artist-likes-count", artistId],
    { revalidate: 60, tags: ["artist-likes", `artist-likes-${artistId}`] },
  )();
}

export async function getArtistLikes(artistId, cookieStore, userId) {
  const supabase = await getSupabaseServerClient(cookieStore);

  const { count: likesCount, error: countError } = await supabase
    .from("artist_likes")
    .select("*", { count: "exact", head: true })
    .eq("artist_id", artistId);

  if (countError) throw new Error("Failed to get likes count");

  let isLiked = false;
  if (userId) {
    const { data: userLike, error: userLikeError } = await supabase
      .from("artist_likes")
      .select("id")
      .eq("artist_id", artistId)
      .eq("user_id", userId)
      .single();

    if (userLikeError && userLikeError.code !== "PGRST116") {
      throw new Error("Failed to check user like status");
    }
    isLiked = !!userLike;
  }

  return { likesCount: likesCount || 0, isLiked };
}

export async function toggleArtistLike(artistId, cookieStore) {
  const { user, supabase } = await getAuthenticatedContext(cookieStore);

  const { data: existingLike, error: checkError } = await supabase
    .from("artist_likes")
    .select("id")
    .eq("artist_id", artistId)
    .eq("user_id", user.id)
    .single();

  if (checkError && checkError.code !== "PGRST116") {
    throw new Error("Failed to check like status");
  }

  const isLiked = !!existingLike;

  if (isLiked) {
    const { error } = await supabase
      .from("artist_likes")
      .delete()
      .eq("artist_id", artistId)
      .eq("user_id", user.id);
    if (error) throw new Error("Failed to remove like");
  } else {
    const { error } = await supabase
      .from("artist_likes")
      .insert({ artist_id: artistId, user_id: user.id });
    if (error) throw new Error("Failed to add like");
  }

  const { count: likesCount, error: countError } = await supabase
    .from("artist_likes")
    .select("*", { count: "exact", head: true })
    .eq("artist_id", artistId);

  if (countError) throw new Error("Failed to get likes count");

  revalidateTag("artists");
  revalidateTag("artist-likes");
  revalidateTag(`artist-likes-${artistId}`);
  revalidateTag(`user-statistics-${user.id}`);
  revalidateTag(`user-statistics-likes-${user.id}`);
  revalidateTag("user-statistics-likes");

  return { likesCount: likesCount || 0, isLiked: !isLiked };
}
