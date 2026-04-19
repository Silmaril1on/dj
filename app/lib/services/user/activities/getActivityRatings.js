import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";
import { requireAuth } from "@/app/lib/services/user/requireAuth";

const LIMIT = 20;

const getCachedRatings = unstable_cache(
  async (userId, page) => {
    const offset = (page - 1) * LIMIT;

    const [{ data: rows, error }, { count: total, error: countError }] =
      await Promise.all([
        supabaseAdmin
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
              image_url,
              artist_slug,
              country,
              city
            )
          `,
          )
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .range(offset, offset + LIMIT - 1),
        supabaseAdmin
          .from("artist_ratings")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId),
      ]);

    if (error) throw new Error("Failed to fetch ratings");
    if (countError) throw new Error("Failed to fetch ratings count");

    const totalPages = Math.ceil((total || 0) / LIMIT);

    return {
      ratings:
        rows?.map((r) => ({
          id: r.id,
          score: r.score,
          created_at: r.created_at,
          artist: {
            id: r.artists.id,
            name: r.artists.name,
            stage_name: r.artists.stage_name,
            image_url: r.artists.image_url,
            artist_slug: r.artists.artist_slug,
            country: r.artists.country,
            city: r.artists.city,
          },
        })) || [],
      pagination: {
        page,
        limit: LIMIT,
        total: total || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  },
  ["user-activity-ratings"],
  {
    revalidate: 5 * 60,
    tags: ["user-activity-ratings"],
  },
);

export async function getActivityRatings(page = 1) {
  const user = await requireAuth();
  return getCachedRatings(user.id, page);
}
