"use server";

import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";

/* ---------- helpers ---------- */

function escapeLike(input) {
  return input.replace(/[%_]/g, (m) => `\\${m}`);
}

function decadeToYearRange(decade) {
  switch (decade) {
    case "1960s":
      return [1960, 1969];
    case "1970s":
      return [1970, 1979];
    case "1980s":
      return [1980, 1989];
    case "1990s":
      return [1990, 1999];
    case "2000s":
      return [2000, 2009];
    case "2010s":
      return [2010, 2019];
    case "2020s":
      return [2020, 2099];
    default:
      return null;
  }
}

/* ---------- core query ---------- */

export async function fetchArtists({
  limit = 20,
  offset = 0,
  country = null,
  name = null,
  sex = null,
  genre = null,
  birthDecade = null,
  ratingRange = null,
  sort = null,
  userId = null,
} = {}) {
  let query = supabaseAdmin
    .from("artists")
    .select(
      `id, name, stage_name, image_url, artist_slug, country, rating_stats, birth, sex, genres, created_at`,
      { count: "exact" },
    )
    .eq("status", "approved");

  if (name) {
    query = query.or(
      `name.ilike.%${escapeLike(name)}%,stage_name.ilike.%${escapeLike(name)}%`,
    );
  }
  if (country) query = query.eq("country", country);
  if (sex) query = query.eq("sex", sex);
  if (genre) query = query.contains("genres", [genre]);

  if (birthDecade) {
    const years = decadeToYearRange(birthDecade);
    if (years) {
      query = query
        .gte("birth", years[0].toString())
        .lte("birth", years[1].toString());
    }
  }

  if (ratingRange) {
    if (ratingRange === "high") {
      query = query.gte("rating_stats->>average_score", "8");
    } else if (ratingRange === "medium") {
      query = query
        .gte("rating_stats->>average_score", "6")
        .lt("rating_stats->>average_score", "8");
    } else if (ratingRange === "low") {
      query = query.lt("rating_stats->>average_score", "6");
    }
  }

  if (sort === "name") {
    query = query.order("stage_name", { ascending: true, nulls: "last" });
  } else if (sort === "newest") {
    query = query.order("created_at", { ascending: false });
  } else if (sort === "oldest") {
    query = query.order("created_at", { ascending: true });
  }

  query = query.range(offset, offset + limit - 1);

  const { data: artistsPage, count, error } = await query;

  if (error) throw new Error(error.message);

  const returned = artistsPage || [];
  const artistIds = returned.map((a) => a.id);
  let likesCount = {};
  let userLikedSet = new Set();
  let userRatingsMap = {};

  if (artistIds.length > 0) {
    const { data: likesData, error: likesError } = await supabaseAdmin
      .from("artist_likes")
      .select("artist_id, user_id")
      .in("artist_id", artistIds);

    if (!likesError) {
      likesData.forEach((l) => {
        likesCount[l.artist_id] = (likesCount[l.artist_id] || 0) + 1;
        if (userId && l.user_id === userId) userLikedSet.add(l.artist_id);
      });
    }

    if (userId) {
      const { data: ratingsData } = await supabaseAdmin
        .from("artist_ratings")
        .select("artist_id, score")
        .in("artist_id", artistIds)
        .eq("user_id", userId);
      (ratingsData || []).forEach((r) => {
        userRatingsMap[r.artist_id] = r.score;
      });
    }
  }

  let artists = returned.map((artist) => ({
    ...artist,
    likesCount: likesCount[artist.id] || 0,
    isLiked: userId ? userLikedSet.has(artist.id) : false,
    userRating: userId ? userRatingsMap[artist.id] || null : null,
    rating: Number(artist.rating_stats?.average_score ?? 0),
  }));

  if (sort === "most_liked") {
    artists = artists.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
  } else if (sort === "rating_high") {
    artists = artists.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (sort === "rating_low") {
    artists = artists.sort((a, b) => (a.rating || 0) - (b.rating || 0));
  }

  const total = typeof count === "number" ? count : null;

  return {
    data: artists,
    total,
    limit,
    offset,
    hasMore:
      total !== null
        ? offset + artists.length < total
        : artists.length === limit,
  };
}

/* ---------- cached server action (initial page load) ---------- */

const getCachedArtists = unstable_cache(
  async (params) => fetchArtists(params),
  ["artists-list"],
  { revalidate: 1200, tags: ["artists"] },
);

export async function getAllArtists(params = {}) {
  return getCachedArtists(params);
}
