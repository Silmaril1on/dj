import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/lib/config/supabaseServer";
import { cookies } from "next/headers";

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    // Perform all searches in parallel for better performance
    const [artistsResult, clubsResult, eventsResult] = await Promise.all([
      // Search Artists by name or stage_name
      supabase
        .from("artists")
        .select("id, name, stage_name, artist_image, country, city, genres")
        .or(`name.ilike.%${query}%,stage_name.ilike.%${query}%`)
        .limit(10),

      // Search Clubs by name
      supabase
        .from("clubs")
        .select("id, name, country, city, club_image")
        .ilike("name", `%${query}%`)
        .limit(10),

      // Search Events using the RPC (handles event_name, promoter, venue_name, artists array)
      supabase.rpc("search_events", { q: query }).limit(10),
    ]);

    // Log errors if any
    if (artistsResult.error) {
      console.error("Artist search error:", artistsResult.error);
    }
    if (clubsResult.error) {
      console.error("Club search error:", clubsResult.error);
    }
    if (eventsResult.error) {
      console.error("Event search error:", eventsResult.error);
    }

    // Combine results with type tags
    const combinedResults = [
      ...(artistsResult.data?.map((a) => ({ type: "artist", ...a })) || []),
      ...(clubsResult.data?.map((c) => ({ type: "club", ...c })) || []),
      ...(eventsResult.data?.map((e) => ({ type: "event", ...e })) || []),
    ];

    return NextResponse.json({
      results: combinedResults,
      counts: {
        artists: artistsResult.data?.length || 0,
        clubs: clubsResult.data?.length || 0,
        events: eventsResult.data?.length || 0,
        total: combinedResults.length,
      },
    });
  } catch (err) {
    console.error("Search API error:", err);
    return NextResponse.json(
      { error: "Search failed", message: err.message },
      { status: 500 }
    );
  }
}
