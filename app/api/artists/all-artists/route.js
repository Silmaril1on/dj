// app/api/artists/all-artists/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/lib/config/supabaseServer";
import { cookies } from "next/headers";

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const qp = url.searchParams;

    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);

    const limit = parseInt(qp.get("limit") || "20", 10);
    const offset = parseInt(qp.get("offset") || "0", 10);

    // Filters
    const country = qp.get("country") || null;
    const name = qp.get("name") || null;
    const sex = qp.get("sex") || null;
    const genre = qp.get("genres") || null; // single value expected for filters (for multi - adapt)
    const birthDecade = qp.get("birth_decade") || null;
    const ratingRange = qp.get("rating_range") || null;
    const sort = qp.get("sort") || null;

    // Build base query
    // We will request exact count for pagination
    let query = supabase
      .from("artists")
      .select(
        `id, name, stage_name, artist_image, country, rating_stats, birth, sex, genres, created_at`,
        { count: "exact" }
      )
      .eq("status", "approved");

    // TEXT search on name / stage_name (case-insensitive)
    if (name) {
      // use ilike for partial match
      query = query.or(
        `name.ilike.%${escapeLike(name)}%,stage_name.ilike.%${escapeLike(name)}%`
      );
    }

    if (country) {
      query = query.eq("country", country);
    }

    if (sex) {
      query = query.eq("sex", sex);
    }

    if (genre) {
      // genres is an array column — use contains to match single value
      // .contains expects an array: ['House']
      query = query.contains("genres", [genre]);
    }

    // Birth decade -> apply SQL range on birth date column (birth assumed date)
    if (birthDecade) {
      const years = decadeToYearRange(birthDecade);
      if (years) {
        query = query.gte("birth", years[0].toString()).lte("birth", years[1].toString());
      }
    }

    // Rating range - we try to use JSON path filter on rating_stats->average_score (Postgres JSON)
    // If your Supabase/Postgres JSON path name differs, adapt this line.
    if (ratingRange) {
      if (ratingRange === "high") {
        query = query.gte("rating_stats->>average_score", "8"); // >= 8.0
      } else if (ratingRange === "medium") {
        query = query.gte("rating_stats->>average_score", "6").lt("rating_stats->>average_score", "8");
      } else if (ratingRange === "low") {
        query = query.lt("rating_stats->>average_score", "6");
      }
    }

    // Sorting:
    // For name, rating (if available in json), created_at
    if (sort === "name") {
      query = query.order("stage_name", { ascending: true, nulls: "last" });
    } else if (sort === "rating_high") {
      // order by JSON field - using ->> path to text; cast to numeric if needed server-side
      // Supabase supports ordering by column; ordering by JSON path may depend on version.
      // As a fallback we will not break if order by path fails (client can sort)
      try {
        query = query.order("rating_stats->>average_score", { ascending: false });
      } catch (e) {
        // ignore ordering failure; we'll apply client-side fallback
      }
    } else if (sort === "rating_low") {
      try {
        query = query.order("rating_stats->>average_score", { ascending: true });
      } catch (e) {
        // ignore
      }
    } else if (sort === "newest") {
      query = query.order("created_at", { ascending: false });
    } else if (sort === "oldest") {
      query = query.order("created_at", { ascending: true });
    }

    // Apply pagination range
    const from = offset;
    const to = offset + limit - 1;
    query = query.range(from, to);

    const { data: artistsPage, count, error: artistsError } = await query;

    if (artistsError) {
      console.error("Error fetching artists (filtered):", artistsError);
      return NextResponse.json({ error: artistsError.message }, { status: 500 });
    }

    // If no results just return empty page
    const returned = artistsPage || [];

    // Fetch likes count for artists on this page
    const artistIds = returned.map((a) => a.id);
    let likesCount = {};
    if (artistIds.length > 0) {
      const { data: likesData, error: likesError } = await supabase
        .from("artist_likes")
        .select("artist_id")
        .in("artist_id", artistIds);

      if (likesError) {
        console.error("Error fetching likes:", likesError);
      } else {
        likesData.forEach((l) => {
          likesCount[l.artist_id] = (likesCount[l.artist_id] || 0) + 1;
        });
      }
    }

    const artistsWithLikes = returned.map((artist) => ({
      ...artist,
      likesCount: likesCount[artist.id] || 0,
      rating: Number(artist.rating_stats?.average_score ?? 0),
    }));

    // If client requested sorting by most_liked or rating but DB couldn't sort JSON field,
    // apply client-side stable sort to guarantee expected order.
    let finalList = artistsWithLikes;
    if (sort === "most_liked") {
      finalList = finalList.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
    } else if (sort === "rating_high") {
      finalList = finalList.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sort === "rating_low") {
      finalList = finalList.sort((a, b) => (a.rating || 0) - (b.rating || 0));
    }

    const total = typeof count === "number" ? count : null;

    return NextResponse.json({
      data: finalList,
      total,
      limit,
      offset,
      hasMore: total !== null ? offset + finalList.length < total : finalList.length === limit,
    });
  } catch (error) {
    console.error("Error in GET all-artists API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ---------- helpers ---------- */

function escapeLike(input) {
  // escape percent/underscore for ilike safety
  return input.replace(/[%_]/g, (m) => `\\${m}`);
}

function decadeToYearRange(decade) {
  // returns [startYear, endYear]
  switch (decade) {
    case "1960s": return [1960, 1969];
    case "1970s": return [1970, 1979];
    case "1980s": return [1980, 1989];
    case "1990s": return [1990, 1999];
    case "2000s": return [2000, 2009];
    case "2010s": return [2010, 2019];
    case "2020s": return [2020, 2099];
    default: return null;
  }
}
