import { supabaseAdmin } from "@/app/lib/config/supabaseServer";
import { revalidateTag } from "next/cache";

function buildPagination(page, limit, total) {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

export async function getArtistByIdentifier(artistSlug, artistId) {
  let query = supabaseAdmin
    .from("artists")
    .select("id, name, stage_name, artist_image, genres, artist_slug");

  query = artistSlug
    ? query.eq("artist_slug", artistSlug)
    : query.eq("id", artistId);

  const { data: artist, error } = await query.single();
  return { artist, error };
}

export async function getArtistReviews(artistId, page = 1, limit = 20) {
  const offset = (page - 1) * limit;

  const {
    data: reviews,
    error: fetchError,
    count: totalReviews,
  } = await supabaseAdmin
    .from("artist_reviews")
    .select(`*, users!inner(id, userName, user_avatar)`, { count: "exact" })
    .eq("artist_id", artistId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (fetchError) return { error: fetchError };

  const reviewUserIds = reviews?.map((r) => r.user_id) ?? [];
  let userRatings = {};

  if (reviewUserIds.length > 0) {
    const { data: ratingsData, error: ratingsError } = await supabaseAdmin
      .from("artist_ratings")
      .select("user_id, score")
      .eq("artist_id", artistId)
      .in("user_id", reviewUserIds);

    if (!ratingsError) {
      ratingsData?.forEach(({ user_id, score }) => {
        userRatings[user_id] = score;
      });
    }
  }

  const reviewsWithRatings =
    reviews?.map((review) => ({
      ...review,
      userRating: userRatings[review.user_id] ?? null,
    })) ?? [];

  return {
    reviews: reviewsWithRatings,
    totalReviews: totalReviews ?? 0,
    pagination: buildPagination(page, limit, totalReviews ?? 0),
  };
}

export async function createReview(artistId, userId, reviewTitle, reviewText) {
  const { data: newReview, error: insertError } = await supabaseAdmin
    .from("artist_reviews")
    .insert({
      artist_id: artistId,
      user_id: userId,
      review_title: reviewTitle,
      review_text: reviewText,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select(`*, users!inner(id, userName, user_avatar)`)
    .single();

  if (insertError) return { error: insertError };

  revalidateTag("artists");
  revalidateTag(`artist-${artistId}`);
  revalidateTag(`user-statistics-${userId}`);
  revalidateTag(`user-statistics-reviews-${userId}`);
  revalidateTag("user-statistics-reviews");

  return { review: newReview };
}

export async function getUserReviews(supabase, userId, page = 1, limit = 20) {
  const offset = (page - 1) * limit;

  const { data: userReviewsData, error: reviewsError } = await supabase
    .from("artist_reviews")
    .select(
      `id, review_title, review_text, created_at, updated_at,
       artists!inner(id, name, stage_name, artist_image)`,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (reviewsError) return { error: reviewsError };

  const { count: totalReviews, error: countError } = await supabase
    .from("artist_reviews")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (countError) return { error: countError };

  const reviews =
    userReviewsData?.map(
      ({ id, review_title, review_text, created_at, updated_at, artists }) => ({
        id,
        review_title,
        review_text,
        created_at,
        updated_at,
        artist: {
          id: artists.id,
          name: artists.name,
          stage_name: artists.stage_name,
          artist_image: artists.artist_image,
        },
      }),
    ) ?? [];

  return {
    reviews,
    totalReviews: totalReviews ?? 0,
    pagination: buildPagination(page, limit, totalReviews ?? 0),
  };
}

export async function getLimitedReviews(supabase, artistId, limit = 6) {
  const { data: reviews, error: reviewsError } = await supabase
    .from("artist_reviews")
    .select(
      `review_title, review_text, created_at, user_id,
       users:user_id(id, userName, user_avatar)`,
    )
    .eq("artist_id", artistId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (reviewsError) return { error: reviewsError };

  const reviewsWithUsers =
    reviews?.map(({ users, ...reviewData }) => ({
      ...reviewData,
      user: users ?? { userName: "Unknown User", user_avatar: null },
    })) ?? [];

  return { reviews: reviewsWithUsers };
}

export async function toggleReviewLike(supabase, reviewId, userId, action) {
  const { data: review, error: fetchError } = await supabase
    .from("artist_reviews")
    .select("*")
    .eq("id", reviewId)
    .single();

  if (fetchError) return { error: fetchError };

  let newLikes = [...(review.likes ?? [])];
  let newDislikes = [...(review.dislikes ?? [])];

  if (action === "like") {
    newDislikes = newDislikes.filter((id) => id !== userId);
    newLikes = newLikes.includes(userId)
      ? newLikes.filter((id) => id !== userId)
      : [...newLikes, userId];
  } else {
    newLikes = newLikes.filter((id) => id !== userId);
    newDislikes = newDislikes.includes(userId)
      ? newDislikes.filter((id) => id !== userId)
      : [...newDislikes, userId];
  }

  const { error: updateError } = await supabase
    .from("artist_reviews")
    .update({
      likes: newLikes,
      dislikes: newDislikes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reviewId);

  if (updateError) return { error: updateError };

  const { data: completeReview, error: completeError } = await supabase
    .from("artist_reviews")
    .select(
      `*, users(id, userName, user_avatar), artists(name, stage_name, artist_image, genres)`,
    )
    .eq("id", reviewId)
    .single();

  return {
    review: completeError
      ? {
          ...review,
          likes: newLikes,
          dislikes: newDislikes,
          updated_at: new Date().toISOString(),
        }
      : completeReview,
    newLikes,
    newDislikes,
  };
}
