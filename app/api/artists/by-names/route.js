import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/app/lib/config/supabaseServer";

// GET /api/artists/by-names?names=%5B%22armin%20van%20buuren%22,...%5D
// `names` should be a JSON-encoded array of strings.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawNames = searchParams.get("names");

    if (!rawNames) {
      return NextResponse.json(
        { error: "Query parameter 'names' is required" },
        { status: 400 },
      );
    }

    let names;
    try {
      names = JSON.parse(rawNames);
    } catch (e) {
      return NextResponse.json(
        { error: "'names' must be a JSON-encoded array of strings" },
        { status: 400 },
      );
    }

    if (!Array.isArray(names) || names.length === 0) {
      return NextResponse.json(
        { error: "'names' must be a non-empty array" },
        { status: 400 },
      );
    }

    const normalizedNames = names
      .map((n) => (typeof n === "string" ? n.trim() : ""))
      .filter(Boolean);

    if (normalizedNames.length === 0) {
      return NextResponse.json(
        { error: "No valid artist names provided" },
        { status: 400 },
      );
    }

    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);

    // Build OR filter: name.ilike.%x% OR stage_name.ilike.%x% for each name
    const orFilters = [];
    for (const name of normalizedNames) {
      const escaped = name.replace(/,/g, " ");
      orFilters.push(`name.ilike.%${escaped}%`);
      orFilters.push(`stage_name.ilike.%${escaped}%`);
    }

    const { data: artists, error } = await supabase
      .from("artists")
      .select("id, name, stage_name, artist_image, artist_slug")
      .or(orFilters.join(","))
      .limit(5);

    if (error) {
      console.error("Error fetching artists by names:", error);
      return NextResponse.json(
        { error: "Failed to fetch artists" },
        { status: 500 },
      );
    }

    return NextResponse.json({ artists: artists || [] });
  } catch (error) {
    console.error("Error in /api/artists/by-names:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
