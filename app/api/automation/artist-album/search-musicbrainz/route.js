import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerUser } from "@/app/lib/config/supabaseServer";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const MUSICBRAINZ_API = "https://musicbrainz.org/ws/2";
const USER_AGENT = "DJApp/1.0.0 (contact@djapp.com)";

async function fetchMusicBrainz(url) {
  await sleep(1000); // Rate limit
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`MusicBrainz API error: ${response.status}`);
  }

  return response.json();
}

export async function GET(request) {
  try {
    // Authentication & Admin check
    const cookieStore = await cookies();
    const { user, error: userError } = await getServerUser(cookieStore);

    if (userError || !user) {
      console.log("❌ Authentication failed");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!user.is_admin) {
      console.log("❌ User is not admin");
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();

    if (!query || query.length < 2) {
      console.log("❌ Query too short");
      return NextResponse.json({ results: [] });
    }

    // Search MusicBrainz for artists
    const encodedQuery = encodeURIComponent(query);
    const url = `${MUSICBRAINZ_API}/artist/?query=artist:${encodedQuery}&fmt=json&limit=10`;

    const data = await fetchMusicBrainz(url);

    if (!data.artists || data.artists.length === 0) {
      console.log("❌ No artists found on MusicBrainz");
      return NextResponse.json({ results: [] });
    }

    // Transform MusicBrainz results to match our format
    const results = data.artists.map((artist) => ({
      type: "musicbrainz_artist",
      musicbrainz_id: artist.id,
      name: artist.name,
      stage_name: artist.name,
      country: artist.country || "Unknown",
      genres: artist.tags?.slice(0, 3).map((t) => t.name) || [],
      score: artist.score || 0,
      disambiguation: artist.disambiguation || null,
      artist_image: null, // MusicBrainz doesn't provide images in search
    }));

    return NextResponse.json({
      results,
      counts: {
        artists: results.length,
        total: results.length,
      },
      source: "musicbrainz",
    });
  } catch (error) {
    console.error("❌ MusicBrainz search error:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      { error: "Search failed", message: error.message },
      { status: 500 }
    );
  }
}
