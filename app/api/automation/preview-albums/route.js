import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerUser, supabaseAdmin } from "@/app/lib/config/supabaseServer";

// Rate limiting helper
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const MUSICBRAINZ_API = "https://musicbrainz.org/ws/2";
const USER_AGENT = "DJApp/1.0.0 (contact@djapp.com)";

async function fetchMusicBrainz(url) {
  console.log("🌐 MusicBrainz fetch starting...");
  console.log("   URL:", url);

  try {
    await sleep(1000);
    console.log("✅ Sleep complete, making request...");

    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
    });

    console.log("📡 Response received:");
    console.log("   Status:", response.status);
    console.log("   OK:", response.ok);
    console.log("   StatusText:", response.statusText);

    if (!response.ok) {
      const error = `MusicBrainz API error: ${response.status} ${response.statusText}`;
      console.error("❌", error);
      throw new Error(error);
    }

    const data = await response.json();
    console.log("✅ JSON parsed successfully");
    return data;
  } catch (error) {
    console.error("❌ fetchMusicBrainz ERROR:");
    console.error("   Message:", error.message);
    console.error("   Stack:", error.stack);
    console.error("   Error type:", error.constructor.name);
    throw error;
  }
}

async function getMusicBrainzArtistId(artistName) {
  const query = encodeURIComponent(artistName);
  const url = `${MUSICBRAINZ_API}/artist/?query=artist:${query}&fmt=json`;

  const data = await fetchMusicBrainz(url);

  if (!data.artists || data.artists.length === 0) {
    throw new Error(`No artist found for: ${artistName}`);
  }

  const bestMatch = data.artists[0];
  return {
    id: bestMatch.id,
    name: bestMatch.name,
    score: bestMatch.score || 0,
  };
}

async function fetchAlbums(artistMbid) {
  const url = `${MUSICBRAINZ_API}/release-group?artist=${artistMbid}&type=album|ep&fmt=json&limit=100`;

  const data = await fetchMusicBrainz(url);

  if (!data["release-groups"]) {
    return [];
  }

  return data["release-groups"]
    .filter((rg) => {
      const primaryType = rg["primary-type"];
      const secondaryTypes = rg["secondary-types"] || [];
      return (
        (primaryType === "Album" || primaryType === "EP") &&
        !secondaryTypes.includes("Compilation") &&
        !secondaryTypes.includes("Live")
      );
    })
    .map((rg) => ({
      id: rg.id,
      title: rg.title,
      releaseDate: rg["first-release-date"] || null,
      primaryType: rg["primary-type"],
    }));
}

export async function GET(request) {
  console.log("═══════════════════════════════════════════");
  console.log("🔵 PREVIEW ALBUMS API CALLED");
  console.log("═══════════════════════════════════════════");

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
    const artistId = searchParams.get("artistId");
    const musicbrainzId = searchParams.get("musicbrainz_id");
    const artistName = searchParams.get("name");

    console.log("📝 Request params:");
    console.log("  - artistId:", artistId);
    console.log("  - musicbrainz_id:", musicbrainzId);
    console.log("  - name:", artistName);

    let artist = null;
    let mbArtistId = musicbrainzId;
    let mbArtistName = null;

    // If we have an artistId, fetch from database
    if (artistId) {
      console.log("🔍 Fetching artist from database...");
      const { data: dbArtist, error: artistError } = await supabaseAdmin
        .from("artists")
        .select("id, name, stage_name, musicbrainz_artist_id")
        .eq("id", artistId)
        .single();

      if (artistError || !dbArtist) {
        console.log("❌ Artist not found in database");
        return NextResponse.json(
          { error: "Artist not found" },
          { status: 404 }
        );
      }

      artist = dbArtist;
      mbArtistId = artist.musicbrainz_artist_id || mbArtistId;
      console.log("✅ Found artist in database:", artist);
    }

    // If no MusicBrainz ID yet, fetch it
    if (!mbArtistId) {
      const searchName = artistName || artist?.stage_name || artist?.name;
      console.log(`🌐 Fetching MusicBrainz ID for: ${searchName}`);
      const mbArtist = await getMusicBrainzArtistId(searchName);
      mbArtistId = mbArtist.id;
      mbArtistName = mbArtist.name;
      console.log("✅ Got MusicBrainz ID:", mbArtistId, "Name:", mbArtistName);

      // Save MusicBrainz Artist ID if we have a database artist
      if (artistId) {
        await supabaseAdmin
          .from("artists")
          .update({ musicbrainz_artist_id: mbArtistId })
          .eq("id", artistId);
        console.log("✅ Saved MusicBrainz ID to database");
      }
    }

    // Fetch albums
    console.log(`🌐 Fetching albums for MusicBrainz Artist ID: ${mbArtistId}`);
    const albums = await fetchAlbums(mbArtistId);
    console.log(`✅ Found ${albums.length} albums on MusicBrainz`);

    // Check which albums already exist (only if we have an artistId)
    let existingIds = new Set();
    if (artistId) {
      const { data: existingAlbums } = await supabaseAdmin
        .from("artist_albums")
        .select("musicbrainz_release_group_id")
        .eq("artist_id", artistId);

      existingIds = new Set(
        existingAlbums?.map((a) => a.musicbrainz_release_group_id) || []
      );
      console.log(`✅ Found ${existingIds.size} already imported albums`);
    }

    // Mark albums that already exist
    const albumsWithStatus = albums.map((album) => ({
      ...album,
      alreadyImported: existingIds.has(album.id),
    }));

    const response = {
      success: true,
      artist: {
        id: artistId || null,
        name: mbArtistName || artistName || artist?.stage_name || artist?.name,
        mbArtistId,
        mbArtistName,
      },
      albums: albumsWithStatus,
      totalFound: albums.length,
      alreadyImported: existingIds.size,
    };

    console.log("📦 Sending response:");
    console.log(JSON.stringify(response, null, 2));
    console.log("═══════════════════════════════════════════\n");

    return NextResponse.json(response);
  } catch (error) {
    console.error("❌ ═══════════════════════════════════════");
    console.error("❌ PREVIEW ALBUMS ERROR:");
    console.error("❌ ═══════════════════════════════════════");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Error name:", error.name);
    console.error("Error cause:", error.cause);
    console.error(
      "Full error object:",
      JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
    );
    console.error("═══════════════════════════════════════════\n");

    return NextResponse.json(
      {
        error: "Failed to fetch albums",
        details: error.message,
        errorName: error.name,
        errorCause: error.cause?.toString(),
      },
      { status: 500 }
    );
  }
}
