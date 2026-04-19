import { supabaseAdmin } from "@/app/lib/config/supabaseServer";
import { requireAuth } from "@/app/lib/services/user/requireAuth";

export async function getUserReviews({ page = 1, limit = 20 } = {}) {
  const user = await requireAuth();
  const offset = (page - 1) * limit;

  const [reviewsResult, countResult] = await Promise.all([
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
          image_url
        )
      `,
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1),
    supabaseAdmin
      .from("artist_reviews")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  if (reviewsResult.error) throw new Error("Failed to fetch user reviews");
  if (countResult.error) throw new Error("Failed to fetch reviews count");

  const reviews =
    reviewsResult.data?.map((review) => ({
      id: review.id,
      review_title: review.review_title,
      review_text: review.review_text,
      created_at: review.created_at,
      updated_at: review.updated_at,
      artist: {
        id: review.artists.id,
        name: review.artists.name,
        stage_name: review.artists.stage_name,
        image_url: review.artists.image_url,
      },
    })) || [];

  const total = countResult.count || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    reviews,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}
