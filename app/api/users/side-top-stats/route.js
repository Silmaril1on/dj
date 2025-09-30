import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/lib/config/supabaseServer";
import { cookies } from "next/headers";

// Helper: get Monday and Sunday for a given week offset
function getWeekRange(offset = 0) {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - day + 1 - offset * 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday.toISOString(), end: sunday.toISOString() };
}

async function getTopArtists(supabase, start, end) {
  // Get all ratings for the week
  const { data: ratings, error } = await supabase
    .from("artist_ratings")
    .select("artist_id, score, created_at")
    .gte("created_at", start)
    .lte("created_at", end);

  if (error) throw new Error(error.message);

  // Group by artist_id
  const grouped = {};
  ratings.forEach(r => {
    if (!grouped[r.artist_id]) grouped[r.artist_id] = [];
    grouped[r.artist_id].push(r.score);
  });

  // Calculate average and count
  const stats = Object.entries(grouped).map(([artist_id, scores]) => ({
    artist_id,
    average: scores.reduce((a, b) => a + b, 0) / scores.length,
    count: scores.length,
  }));

  // Sort and pick top 5
  const top5 = stats
    .sort((a, b) => b.average - a.average || b.count - a.count)
    .slice(0, 5);

  // Fetch artist info
  const ids = top5.map(a => a.artist_id);
  if (ids.length === 0) return [];
  const { data: artists, error: artistError } = await supabase
    .from("artists")
    .select("id, name, stage_name, artist_image, rating_stats")
    .in("id", ids);

  if (artistError) throw new Error(artistError.message);

  // Merge stats with artist info
  return top5.map(stat => {
    const artist = artists.find(a => a.id === stat.artist_id);
    return {
      ...artist,
      weeklyAverage: Math.round(stat.average * 100) / 100,
      weeklyRatingCount: stat.count,
      metascore: artist.rating_stats?.metascore || 0,
      allTimeAverage: artist.rating_stats?.average_score || 0,
      allTimeTotal: artist.rating_stats?.total_ratings || 0,
    };
  });
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);

    // This week and previous week ranges
    const { start: thisWeekStart, end: thisWeekEnd } = getWeekRange(0);
    const { start: prevWeekStart, end: prevWeekEnd } = getWeekRange(1);


    // Get top artists for both weeks
    const thisWeek = await getTopArtists(supabase, thisWeekStart, thisWeekEnd);
    const previousWeek = await getTopArtists(supabase, prevWeekStart, prevWeekEnd);

    // Add rank change info
    const thisWeekWithChange = thisWeek.map((artist, idx) => {
      const prevRank = previousWeek.findIndex(a => a.id === artist.id);
      let changeType = "same";
      let change = 0;
      if (prevRank === -1) {
        changeType = "new";
      } else {
        change = prevRank - idx;
        changeType = change > 0 ? "up" : change < 0 ? "down" : "same";
      }
      return { ...artist, rank: idx + 1, change, changeType, previousRank: prevRank >= 0 ? prevRank + 1 : null };
    });

    return NextResponse.json({
      success: true,
      data: {
        thisWeek: thisWeekWithChange,
        previousWeek: previousWeek.map((artist, idx) => ({ ...artist, rank: idx + 1 })),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message, data: { thisWeek: [], previousWeek: [] } },
      { status: 500 }
    );
  }
}

