import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/lib/config/supabaseServer";
import { cookies } from "next/headers";

export async function GET(request) {
  console.log("═══════════════════════════════════════════");
  console.log("🔍 AUTOMATION SEARCH ARTISTS API CALLED");
  console.log("═══════════════════════════════════════════");

  try {
    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();

    console.log("📝 Search query:", query);
    console.log("📝 Query length:", query?.length);

    if (!query || query.length < 2) {
      console.log("❌ Query too short or empty");
      return NextResponse.json({
        results: [],
        counts: { artists: 0, total: 0 },
      });
    }

    console.log("✅ Searching artists table for:", query);

    // Search ONLY in artists table by name or stage_name
    const { data: artists, error: artistsError } = await supabase
      .from("artists")
      .select(
        "id, name, stage_name, image_url, country, city, genres, musicbrainz_artist_id",
      )
      .or(`name.ilike.%${query}%,stage_name.ilike.%${query}%`)
      .limit(20);

    if (artistsError) {
      console.error("❌ Artist search error:", artistsError);
      return NextResponse.json(
        { error: "Search failed", details: artistsError.message },
        { status: 500 },
      );
    }

    console.log("✅ Artists found:", artists?.length || 0);
    console.log("📦 Artists data:");
    console.log(JSON.stringify(artists, null, 2));

    // Transform to match expected format
    const results = (artists || []).map((artist) => ({
      type: "artist",
      id: artist.id,
      name: artist.name,
      stage_name: artist.stage_name,
      image_url: artist.image_url,
      country: artist.country,
      city: artist.city,
      genres: artist.genres,
      musicbrainz_artist_id: artist.musicbrainz_artist_id,
    }));

    console.log("✅ Transformed results count:", results.length);
    console.log("📊 Sample result:", results[0]);
    console.log("═══════════════════════════════════════════\n");

    return NextResponse.json({
      results,
      counts: {
        artists: results.length,
        total: results.length,
      },
      source: "database",
    });
  } catch (err) {
    console.error("❌ Search API error:", err);
    console.error("Error stack:", err.stack);
    return NextResponse.json(
      { error: "Search failed", message: err.message },
      { status: 500 },
    );
  }
}
