"use server";
import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";

const LIMIT = 8;
const CANDIDATE_POOL = 60;
const MIN_SHARED_STRICT = 2; // primary threshold
const MIN_SHARED_FALLBACK = 1; // fallback threshold

/**
 * Returns up to 8 approved artists ranked by shared genre count.
 * - Prefers artists sharing ≥2 genres (more precise match).
 * - Falls back to ≥1 match to fill remaining slots if needed.
 *
 * @param {string}   artistId - ID of the current artist (excluded)
 * @param {string[]} genres   - Genres of the current artist
 * @returns {Promise<Object[]>}
 */
export async function getRelatedArtists(artistId, genres) {
  if (!artistId || !Array.isArray(genres) || genres.length === 0) return [];

  // Stable cache key: sort genres so order doesn't create duplicate cache entries
  const sortedGenres = [...genres].sort();

  return unstable_cache(
    async () => {
      const { data, error } = await supabaseAdmin
        .from("artists")
        .select(
          "id, name, stage_name, artist_image, artist_slug, country, genres",
        )
        .eq("status", "approved")
        .neq("id", artistId)
        .overlaps("genres", sortedGenres)
        .limit(CANDIDATE_POOL);

      if (error) throw new Error(error.message);
      if (!data || data.length === 0) return [];

      const genreSet = new Set(sortedGenres.map((g) => g.toLowerCase()));

      const scored = data
        .map((artist) => {
          const sharedCount = Array.isArray(artist.genres)
            ? artist.genres.filter((g) => genreSet.has(g.toLowerCase())).length
            : 0;
          return { ...artist, _sharedGenres: sharedCount };
        })
        .sort((a, b) => b._sharedGenres - a._sharedGenres);

      const strict = scored.filter((a) => a._sharedGenres >= MIN_SHARED_STRICT);

      let result;
      if (strict.length >= LIMIT) {
        result = strict.slice(0, LIMIT);
      } else {
        const strictIds = new Set(strict.map((a) => a.id));
        const fallback = scored.filter(
          (a) => a._sharedGenres >= MIN_SHARED_FALLBACK && !strictIds.has(a.id),
        );
        result = [...strict, ...fallback].slice(0, LIMIT);
      }

      return result.map(({ _sharedGenres, ...artist }) => artist);
    },
    [`related-artists-${artistId}-${sortedGenres.join(",")}`],
    { revalidate: 3600, tags: ["artists", `related-artists-${artistId}`] },
  )();
}
