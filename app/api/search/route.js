import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/lib/config/supabaseServer";
import { cookies } from "next/headers";

/** Escape ILIKE wildcard characters in user input */
function safeLike(s) {
  return s.replace(/%/g, "\\%").replace(/_/g, "\\_");
}

/** Escape special characters for use in a JS RegExp */
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const q = safeLike(query.toLowerCase());

    // Regex for word-prefix check used in JS post-filtering (lineup arrays)
    const wordPrefixRegex = new RegExp(
      `(^|[\\s\\-&,])${escapeRegex(query)}`,
      "i",
    );

    // Run all searches in parallel
    const [
      artistsResult,
      clubsResult,
      eventsResult,
      eventsLineupResult,
      festivalsResult,
      festivalLineupResult,
    ] = await Promise.all([
      // Artists: search both stage_name and name for full coverage
      supabase
        .from("artists")
        .select(
          "id, name, stage_name, image_url, country, city, genres, artist_slug",
        )
        .or(
          [
            `stage_name.ilike.${q}%`,
            `stage_name.ilike.% ${q}%`,
            `name.ilike.${q}%`,
            `name.ilike.% ${q}%`,
          ].join(","),
        )
        .eq("status", "approved")
        .limit(10),

      // Clubs: word-prefix on name
      supabase
        .from("clubs")
        .select("id, name, country, city, image_url, club_slug")
        .or(`name.ilike.${q}%,name.ilike.% ${q}%`)
        .eq("status", "approved")
        .limit(10),

      // Events: word-prefix on event_name / venue_name
      supabase
        .from("events")
        .select(
          "id, event_name, venue_name, country, city, image_url, event_slug",
        )
        .or(
          `event_name.ilike.${q}%,event_name.ilike.% ${q}%,venue_name.ilike.${q}%,venue_name.ilike.% ${q}%`,
        )
        .eq("status", "approved")
        .limit(8),

      // Events: lineup search – use an RPC function that unnests the artists
      // text[] and applies ILIKE per element, avoiding PostgREST's lack of
      // support for cast syntax (::) in filter expressions (PGRST100).
      // JS post-filter enforces word-prefix matching to eliminate false positives.
      supabase
        .rpc("search_events_by_lineup", { search_term: q })
        .select(
          "id, event_name, venue_name, country, city, image_url, event_slug, artists",
        ),

      // Festivals: word-prefix on name
      supabase
        .from("festivals")
        .select("id, name, country, city, image_url, festival_slug")
        .or(`name.ilike.${q}%,name.ilike.% ${q}%`)
        .eq("status", "approved")
        .limit(10),

      // Festival lineup: word-prefix on artist_name, join parent festival
      supabase
        .from("festival_lineup")
        .select(
          "stage_id, festival_stages!inner(festival_id, festivals!inner(id, name, country, city, image_url, festival_slug))",
        )
        .or(`artist_name.ilike.${q}%,artist_name.ilike.% ${q}%`)
        .eq("festival_stages.festivals.status", "approved")
        .limit(20),
    ]);

    // Log errors
    if (artistsResult.error)
      console.error("Artist search error:", artistsResult.error);
    if (clubsResult.error)
      console.error("Club search error:", clubsResult.error);
    if (eventsResult.error)
      console.error("Event search error:", eventsResult.error);
    if (eventsLineupResult.error)
      console.error("Event lineup search error:", eventsLineupResult.error);
    if (festivalsResult.error)
      console.error("Festival search error:", festivalsResult.error);
    if (festivalLineupResult.error)
      console.error(
        "Festival lineup search error:",
        festivalLineupResult.error,
      );

    // Post-filter events lineup: ensure word-prefix match on an actual array element
    const eventsByLineup = (eventsLineupResult.data || []).filter(
      (event) =>
        Array.isArray(event.artists) &&
        event.artists.some((name) => wordPrefixRegex.test(name)),
    );

    // Merge event results, avoiding duplicates
    const namedEventIds = new Set((eventsResult.data || []).map((e) => e.id));
    const additionalEvents = eventsByLineup
      .filter((e) => !namedEventIds.has(e.id))
      // Strip the artists array from the response for a consistent shape
      .map(({ artists: _artists, ...rest }) => rest);

    // Collect unique festivals from lineup matches, skipping ones already found by name
    const namedFestivalIds = new Set(
      (festivalsResult.data || []).map((f) => f.id),
    );
    const seenFestivalIds = new Set(namedFestivalIds);
    const festivalsFromLineup = [];
    for (const row of festivalLineupResult.data || []) {
      const fest = row.festival_stages?.festivals;
      if (fest && !seenFestivalIds.has(fest.id)) {
        seenFestivalIds.add(fest.id);
        festivalsFromLineup.push(fest);
      }
    }

    // Build final combined results
    const combinedResults = [
      ...(artistsResult.data?.map((a) => ({ type: "artist", ...a })) || []),
      ...(clubsResult.data?.map((c) => ({ type: "club", ...c })) || []),
      ...(eventsResult.data?.map((e) => ({ type: "event", ...e })) || []),
      ...additionalEvents.map((e) => ({ type: "event", ...e })),
      ...(festivalsResult.data?.map((f) => ({ type: "festival", ...f })) || []),
      ...festivalsFromLineup.map((f) => ({ type: "festival", ...f })),
    ];

    const totalEvents =
      (eventsResult.data?.length || 0) + additionalEvents.length;
    const totalFestivals =
      (festivalsResult.data?.length || 0) + festivalsFromLineup.length;

    return NextResponse.json({
      results: combinedResults,
      counts: {
        artists: artistsResult.data?.length || 0,
        clubs: clubsResult.data?.length || 0,
        events: totalEvents,
        festivals: totalFestivals,
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
