import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerUser, supabaseAdmin } from "@/app/lib/config/supabaseServer";

// Rate limiting helper
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const MUSICBRAINZ_API = "https://musicbrainz.org/ws/2";
const COVERART_API = "https://coverartarchive.org";
const USER_AGENT = "DJApp/1.0.0 (contact@djapp.com)";

async function fetchMusicBrainz(url) {
  try {
    await sleep(1000);

    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const error = `MusicBrainz API error: ${response.status} ${response.statusText}`;
      throw new Error(error);
    }

    const data = await response.json();
    return data;
  } catch (error) {
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

async function fetchAlbumCover(releaseGroupId) {
  try {
    // First get the release ID from the release-group
    const rgUrl = `${MUSICBRAINZ_API}/release-group/${releaseGroupId}?inc=releases&fmt=json`;
    await sleep(1000);

    const response = await fetch(rgUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
    });

    if (!response.ok) return null;

    const rgData = await response.json();
    if (!rgData.releases || rgData.releases.length === 0) return null;

    // Get official release or first available
    const officialRelease =
      rgData.releases.find((r) => r.status === "Official") ||
      rgData.releases[0];
    const releaseId = officialRelease.id;

    // Fetch cover from Cover Art Archive
    const coverUrl = `${COVERART_API}/release/${releaseId}`;
    const coverResponse = await fetch(coverUrl);

    if (!coverResponse.ok) return null;

    const coverData = await coverResponse.json();

    // Prefer front cover, fallback to first approved image
    const frontImage =
      coverData.images?.find((img) => img.front && img.approved) ||
      coverData.images?.find((img) => img.approved) ||
      coverData.images?.[0];

    return frontImage?.image || null;
  } catch (error) {
    return null;
  }
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

    const { searchParams } = new URL(request.url);
    const artistId = searchParams.get("artistId");
    const musicbrainzId = searchParams.get("musicbrainz_id");
    const artistName = searchParams.get("name");

    let artist = null;
    let mbArtistId = musicbrainzId;
    let mbArtistName = null;

    // If we have an artistId, fetch from database
    if (artistId) {
      const { data: dbArtist, error: artistError } = await supabaseAdmin
        .from("artists")
        .select("id, name, stage_name, musicbrainz_artist_id")
        .eq("id", artistId)
        .single();

      if (artistError || !dbArtist) {
        return NextResponse.json(
          { error: "Artist not found" },
          { status: 404 }
        );
      }

      artist = dbArtist;
      mbArtistId = artist.musicbrainz_artist_id || mbArtistId;
    }

    // If no MusicBrainz ID yet, fetch it
    if (!mbArtistId) {
      const searchName = artistName || artist?.stage_name || artist?.name;
      const mbArtist = await getMusicBrainzArtistId(searchName);
      mbArtistId = mbArtist.id;
      mbArtistName = mbArtist.name;

      if (artistId) {
        await supabaseAdmin
          .from("artists")
          .update({ musicbrainz_artist_id: mbArtistId })
          .eq("id", artistId);
      }
    }

    const albums = await fetchAlbums(mbArtistId);

    let existingIds = new Set();
    if (artistId) {
      const { data: existingAlbums } = await supabaseAdmin
        .from("artist_albums")
        .select("musicbrainz_release_group_id")
        .eq("artist_id", artistId);

      existingIds = new Set(
        existingAlbums?.map((a) => a.musicbrainz_release_group_id) || []
      );
    }

    const albumsWithCovers = await Promise.all(
      albums.map(async (album) => {
        const albumImage = await fetchAlbumCover(album.id);
        return {
          ...album,
          albumImage,
          alreadyImported: existingIds.has(album.id),
        };
      })
    );

    const albumsWithStatus = albumsWithCovers;

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

    return NextResponse.json(response);
  } catch (error) {
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
