import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerUser, supabaseAdmin } from "@/app/lib/config/supabaseServer";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const MUSICBRAINZ_API = "https://musicbrainz.org/ws/2";
const USER_AGENT = "DJApp/1.0.0 (contact@djapp.com)";

async function fetchMusicBrainz(url) {
  await sleep(1000);
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

async function fetchTracklist(releaseGroupId) {
  const rgUrl = `${MUSICBRAINZ_API}/release-group/${releaseGroupId}?inc=releases&fmt=json`;
  const rgData = await fetchMusicBrainz(rgUrl);

  if (!rgData.releases || rgData.releases.length === 0) {
    return [];
  }

  const officialRelease =
    rgData.releases.find((r) => r.status === "Official") || rgData.releases[0];
  const releaseId = officialRelease.id;

  await sleep(1000);
  const releaseUrl = `${MUSICBRAINZ_API}/release/${releaseId}?inc=recordings&fmt=json`;
  const releaseData = await fetchMusicBrainz(releaseUrl);

  if (!releaseData.media || releaseData.media.length === 0) {
    return [];
  }

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

    if (!user.is_admin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { artistId, album } = await request.json();

    if (!artistId || !album) {
      return NextResponse.json(
        { error: "Artist ID and album data are required" },
        { status: 400 }
      );
    }

    // Check if album already exists
    const { data: existingAlbum } = await supabaseAdmin
      .from("artist_albums")
      .select("id, name")
      .eq("musicbrainz_release_group_id", album.id)
      .single();

    if (existingAlbum) {
      return NextResponse.json(
        {
          error: "Album already imported",
          album: existingAlbum,
        },
        { status: 409 }
      );
    }

    // Fetch tracklist
    console.log(`Fetching tracklist for: ${album.title}`);
    const tracklist = await fetchTracklist(album.id);

    // Insert album
    const { data: newAlbum, error: insertError } = await supabaseAdmin
      .from("artist_albums")
      .insert({
        name: album.title,
        release_date: album.releaseDate || null,
        tracklist: tracklist.length > 0 ? tracklist : null,
        artist_id: artistId,
        musicbrainz_release_group_id: album.id,
        user_id: null,
        description: `${album.primaryType} - Imported from MusicBrainz`,
      })
      .select()
      .single();

    if (insertError) {
      console.error(`Failed to insert album:`, insertError);
      return NextResponse.json(
        { error: "Failed to import album", details: insertError.message },
        { status: 500 }
      );
    }

    console.log(`Successfully imported: ${album.title}`);

    return NextResponse.json({
      success: true,
      message: `Album "${album.title}" imported successfully`,
      album: newAlbum,
    });
  } catch (error) {
    console.error("Import single album error:", error);
    return NextResponse.json(
      {
        error: "Failed to import album",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
