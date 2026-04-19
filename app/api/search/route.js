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
    const [artistsResult, clubsResult, eventsResult, festivalsResult] =
      await Promise.all([
        // Search Artists by name or stage_name
        supabase
          .from("artists")
          .select(
            "id, name, stage_name, image_url, country, city, genres, artist_slug",
          )
          .or(`name.ilike.%${query}%,stage_name.ilike.%${query}%`)
          .eq("status", "approved")
          .limit(10),

        // Search Clubs by name
        supabase
          .from("clubs")
          .select("id, name, country, city, image_url, club_slug")
          .ilike("name", `%${query}%`)
          .eq("status", "approved")
          .limit(10),

        // Search Events using the RPC (handles event_name, promoter, venue_name, artists array)
        supabase.rpc("search_events", { q: query }).limit(10),

        // Search Festivals by name
        supabase
          .from("festivals")
          .select("id, name, country, city, image_url, festival_slug")
          .ilike("name", `%${query}%`)
          .eq("status", "approved")
          .limit(10),
      ]);

    // Log errors if any
    if (artistsResult.error)
      console.error("Artist search error:", artistsResult.error);
    if (clubsResult.error)
      console.error("Club search error:", clubsResult.error);
    if (eventsResult.error)
      console.error("Event search error:", eventsResult.error);
    if (festivalsResult.error)
      console.error("Festival search error:", festivalsResult.error);

    // Combine results with type tags
    const combinedResults = [
      ...(artistsResult.data?.map((a) => ({ type: "artist", ...a })) || []),
      ...(clubsResult.data?.map((c) => ({ type: "club", ...c })) || []),
      ...(eventsResult.data?.map((e) => ({ type: "event", ...e })) || []),
      ...(festivalsResult.data?.map((f) => ({ type: "festival", ...f })) || []),
    ];

    return NextResponse.json({
      results: combinedResults,
      counts: {
        artists: artistsResult.data?.length || 0,
        clubs: clubsResult.data?.length || 0,
        events: eventsResult.data?.length || 0,
        festivals: festivalsResult.data?.length || 0,
        total: combinedResults.length,
      },
    });
  } catch (err) {
    console.error("Search API error:", err);
    return NextResponse.json(
      { error: "Search failed", message: err.message },
      { status: 500 },
    );
  }
}
