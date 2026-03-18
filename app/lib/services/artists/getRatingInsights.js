"use server";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";

export async function getArtistRatingInsights(artistId) {
  if (!artistId) throw new Error("Artist ID is required");

  const { data: ratings, error } = await supabaseAdmin
    .from("artist_ratings")
    .select("score")
    .eq("artist_id", artistId);

  if (error) throw new Error("Failed to fetch artist ratings");

  if (!ratings || ratings.length === 0) {
    return { ratingData: [], totalRatings: 0 };
  }

  const totalRatings = ratings.length;
  const ratingCounts = {};
  for (let i = 1; i <= 10; i++) ratingCounts[i] = 0;
  ratings.forEach(({ score }) => {
    if (score >= 1 && score <= 10) ratingCounts[score]++;
  });

  const ratingData = Object.entries(ratingCounts)
    .map(([rating, count]) => ({
      rating: parseInt(rating),
      count,
      percentage: (count / totalRatings) * 100,
    }))
    .sort((a, b) => b.rating - a.rating);

  return { ratingData, totalRatings };
}
