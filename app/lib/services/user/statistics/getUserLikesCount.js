import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";
import { requireAuth } from "@/app/lib/services/user/requireAuth";

const getCachedLikesStats = unstable_cache(
  async (userId) => {
    const [
      { count: totalLikes, error: likesCountError },
      { data: recentLikes, error: recentLikesError },
    ] = await Promise.all([
      supabaseAdmin
        .from("artist_likes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId),
      supabaseAdmin
        .from("artist_likes")
        .select(
          `
          created_at,
          artists!inner(
            id,
            name,
            stage_name,
            artist_image,
            artist_slug
          )
        `,
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    if (likesCountError) throw new Error("Failed to fetch likes count");
    if (recentLikesError)
      throw new Error("Failed to fetch recent liked artists");

    const recentArtists =
      recentLikes?.map((like) => ({
        id: like.artists.id,
        name: like.artists.name,
        stage_name: like.artists.stage_name,
        artist_image: like.artists.artist_image,
        artist_slug: like.artists.artist_slug,
        liked_at: like.created_at,
      })) || [];

    return { totalLikes: totalLikes || 0, recentArtists };
  },
  ["user-statistics", "likes"],
  {
    revalidate: 15 * 60,
    tags: ["user-statistics-likes"],
  },
);

export async function getUserLikesCount() {
  const user = await requireAuth();
  return getCachedLikesStats(user.id);
}
