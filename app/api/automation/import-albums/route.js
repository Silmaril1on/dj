import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerUser, supabaseAdmin } from "@/app/lib/config/supabaseServer";

// Rate limiting helper - MusicBrainz requires 1 second between requests
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// MusicBrainz API base URL
const MUSICBRAINZ_API = "https://musicbrainz.org/ws/2";
const USER_AGENT = "DJApp/1.0.0 (contact@djapp.com)"; // Replace with your actual contact

// Helper to fetch from MusicBrainz with rate limiting
async function fetchMusicBrainz(url) {
  await sleep(1000); // Rate limit: 1 request per second
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

// Step 1: Get MusicBrainz Artist ID
async function getMusicBrainzArtistId(artistName) {
  const query = encodeURIComponent(artistName);
  const url = `${MUSICBRAINZ_API}/artist/?query=artist:${query}&fmt=json`;

  const data = await fetchMusicBrainz(url);

  if (!data.artists || data.artists.length === 0) {
    throw new Error(`No artist found for: ${artistName}`);
  }

  // Return the first result with highest score
  const bestMatch = data.artists[0];
  return {
    id: bestMatch.id,
    name: bestMatch.name,
    score: bestMatch.score || 0,
  };
}

// Step 2: Fetch albums/EPs (excluding singles, compilations)
async function fetchAlbums(artistMbid) {
  const url = `${MUSICBRAINZ_API}/release-group?artist=${artistMbid}&type=album|ep&fmt=json&limit=100`;

  const data = await fetchMusicBrainz(url);

  if (!data["release-groups"]) {
    return [];
  }

  return data["release-groups"]
    .filter((rg) => {
      // Exclude compilations, live albums
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

// Step 3: Fetch tracklist for a specific album
async function fetchTracklist(releaseGroupId) {
  // First, get releases for this release-group
  const rgUrl = `${MUSICBRAINZ_API}/release-group/${releaseGroupId}?inc=releases&fmt=json`;
  const rgData = await fetchMusicBrainz(rgUrl);

  if (!rgData.releases || rgData.releases.length === 0) {
    return [];
  }

  // Pick first official release (prefer status: Official)
  const officialRelease =
    rgData.releases.find((r) => r.status === "Official") || rgData.releases[0];
  const releaseId = officialRelease.id;

  // Now fetch the release with recordings (tracks)
  await sleep(1000); // Rate limit
  const releaseUrl = `${MUSICBRAINZ_API}/release/${releaseId}?inc=recordings&fmt=json`;
  const releaseData = await fetchMusicBrainz(releaseUrl);

  if (!releaseData.media || releaseData.media.length === 0) {
    return [];
  }

  // Extract track titles from all media (discs)
  const tracklist = [];
  for (const medium of releaseData.media) {
    if (medium.tracks) {
      for (const track of medium.tracks) {
        tracklist.push(track.recording.title);
      }
    }
  }

  return tracklist;
}

export async function POST(request) {
  try {
    // Authentication & Admin check
    const cookieStore = await cookies();
    const { user, error: userError } = await getServerUser(cookieStore);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (!user.is_admin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { artistId } = await request.json();

    if (!artistId) {
      return NextResponse.json(
        { error: "Artist ID is required" },
        { status: 400 }
      );
    }

    // Step 1: Fetch artist from database
    const { data: artist, error: artistError } = await supabaseAdmin
      .from("artists")
      .select("id, name, stage_name, musicbrainz_artist_id")
      .eq("id", artistId)
      .single();

    if (artistError || !artist) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    let mbArtistId = artist.musicbrainz_artist_id;
    let mbArtistName = null;

    // Step 2: If no MusicBrainz ID, fetch and save it
    if (!mbArtistId) {
      console.log(
        `Fetching MusicBrainz ID for: ${artist.stage_name || artist.name}`
      );
      const mbArtist = await getMusicBrainzArtistId(
        artist.stage_name || artist.name
      );
      mbArtistId = mbArtist.id;
      mbArtistName = mbArtist.name;

      // Save MusicBrainz Artist ID to database
      const { error: updateError } = await supabaseAdmin
        .from("artists")
        .update({ musicbrainz_artist_id: mbArtistId })
        .eq("id", artistId);

      if (updateError) {
        console.error("Failed to save MusicBrainz Artist ID:", updateError);
      }
    }

    // Step 3: Fetch albums/EPs
    console.log(`Fetching albums for MusicBrainz Artist ID: ${mbArtistId}`);
    const albums = await fetchAlbums(mbArtistId);

    if (albums.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No albums found on MusicBrainz",
        imported: 0,
        skipped: 0,
        mbArtistId,
        mbArtistName,
      });
    }

    let imported = 0;
    let skipped = 0;
    const errors = [];

    // Step 4: Process each album
    for (const album of albums) {
      try {
        // Check if album already exists
        const { data: existingAlbum } = await supabaseAdmin
          .from("artist_albums")
          .select("id")
          .eq("musicbrainz_release_group_id", album.id)
          .single();

        if (existingAlbum) {
          console.log(`Album already exists: ${album.title}`);
          skipped++;
          continue;
        }

        // Fetch tracklist
        console.log(`Fetching tracklist for: ${album.title}`);
        const tracklist = await fetchTracklist(album.id);

        // Insert album into database
        const { error: insertError } = await supabaseAdmin
          .from("artist_albums")
          .insert({
            name: album.title,
            release_date: album.releaseDate || null,
            tracklist: tracklist.length > 0 ? tracklist : null,
            artist_id: artistId,
            musicbrainz_release_group_id: album.id,
            user_id: null, // No user_id for automated imports
            description: `${album.primaryType} - Imported from MusicBrainz`,
          });

        if (insertError) {
          console.error(`Failed to insert album ${album.title}:`, insertError);
          errors.push(`${album.title}: ${insertError.message}`);
          continue;
        }

        console.log(`Successfully imported: ${album.title}`);
        imported++;
      } catch (error) {
        console.error(`Error processing album ${album.title}:`, error);
        errors.push(`${album.title}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import completed: ${imported} albums imported, ${skipped} already existed`,
      imported,
      skipped,
      totalFound: albums.length,
      mbArtistId,
      mbArtistName,
      errors: errors.length > 0 ? errors : null,
    });
  } catch (error) {
    console.error("Import albums error:", error);
    return NextResponse.json(
      {
        error: "Failed to import albums",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
