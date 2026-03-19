import { supabaseAdmin } from "@/app/lib/config/supabaseServer";
import { requireAuth } from "@/app/lib/services/user/requireAuth";

export async function getUserRates({ page = 1, limit = 20 } = {}) {
  const user = await requireAuth();
  const offset = (page - 1) * limit;

  const [ratingsResult, countResult] = await Promise.all([
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
          artist_image,
          artist_slug,
          country,
          city
        )
      `,
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1),
    supabaseAdmin
      .from("artist_ratings")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  if (ratingsResult.error) throw new Error("Failed to fetch user ratings");
  if (countResult.error) throw new Error("Failed to fetch ratings count");

  const ratings =
    ratingsResult.data?.map((rating) => ({
      id: rating.id,
      score: rating.score,
      created_at: rating.created_at,
      artist: {
        id: rating.artists.id,
        name: rating.artists.name,
        stage_name: rating.artists.stage_name,
        artist_image: rating.artists.artist_image,
        artist_slug: rating.artists.artist_slug,
        country: rating.artists.country,
        city: rating.artists.city,
      },
    })) || [];

  const total = countResult.count || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    ratings,
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
