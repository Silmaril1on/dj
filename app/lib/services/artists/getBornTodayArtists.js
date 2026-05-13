"use server";

import { unstable_cache } from "next/cache";
import {
  ServiceError,
  getSupabaseServerClient,
} from "@/app/lib/services/shared";

async function _getBornTodayArtists(cookieStore) {
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();
  const currentYear = today.getFullYear();

  const supabase = await getSupabaseServerClient(cookieStore);

  if (!supabase) {
    throw new ServiceError("Database connection failed", 500);
  }

  const { data: artists, error } = await supabase
    .from("artists")
    .select("id, name, stage_name, image_url, artist_slug, birth")
    .eq("status", "approved")
    .not("birth", "is", null);

  if (error) {
    throw new ServiceError(error.message || "Failed to fetch artists", 500);
  }

  const artistsBornToday =
    artists?.filter((artist) => {
      if (!artist.birth) {
        return false;
      }

      const birthDate = new Date(artist.birth);

      if (Number.isNaN(birthDate.getTime())) {
        return false;
      }

      return (
        birthDate.getMonth() + 1 === currentMonth &&
        birthDate.getDate() === currentDay
      );
    }) || [];

  return artistsBornToday.map((artist) => {
    const birthDate = new Date(artist.birth);
    const birthYear = Number.isNaN(birthDate.getTime())
      ? currentYear
      : birthDate.getFullYear();

    return {
      id: artist.id,
      name: artist.name,
      stage_name: artist.stage_name,
      image_url: artist.image_url,
      artist_slug: artist.artist_slug,
      age: currentYear - birthYear,
    };
  });
}

// Cache per calendar day — invalidates automatically at midnight
const todayKey = new Date().toISOString().split("T")[0];
export const getBornTodayArtists = unstable_cache(
  _getBornTodayArtists,
  [`born-today-${todayKey}`],
  { revalidate: 24 * 60 * 60, tags: ["born-today"] },
);
