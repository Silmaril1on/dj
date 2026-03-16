import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";
import { requireAuth } from "@/app/lib/services/user/requireAuth";

const LIMIT = 20;

const getCachedReviews = unstable_cache(
  async (userId, page) => {
    const offset = (page - 1) * LIMIT;

    const [{ data: rows, error }, { count: total, error: countError }] =
      await Promise.all([
        supabaseAdmin
          .from("artist_reviews")
          .select(
            `
            id,
            review_title,
            review_text,
            created_at,
            updated_at,
            artists!inner(
              id,
              name,
              stage_name,
              artist_image
            )
          `,
          )
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .range(offset, offset + LIMIT - 1),
        supabaseAdmin
          .from("artist_reviews")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId),
      ]);

    if (error) throw new Error("Failed to fetch reviews");
    if (countError) throw new Error("Failed to fetch reviews count");

    const totalPages = Math.ceil((total || 0) / LIMIT);

    return {
      reviews:
        rows?.map((r) => ({
          id: r.id,
          review_title: r.review_title,
          review_text: r.review_text,
          created_at: r.created_at,
          updated_at: r.updated_at,
          artist: {
            id: r.artists.id,
            name: r.artists.name,
            stage_name: r.artists.stage_name,
            artist_image: r.artists.artist_image,
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
  ["user-activity-reviews"],
  {
    revalidate: 5 * 60,
    tags: ["user-activity-reviews"],
  },
);

export async function getActivityReviews(page = 1) {
  const user = await requireAuth();
  return getCachedReviews(user.id, page);
}
