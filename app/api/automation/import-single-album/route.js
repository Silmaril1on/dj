import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerUser, supabaseAdmin } from "@/app/lib/config/supabaseServer";
import sharp from "sharp";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const MUSICBRAINZ_API = "https://musicbrainz.org/ws/2";
const COVERART_API = "https://coverartarchive.org";
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

async function fetchAlbumCover(releaseId) {
  const url = `${COVERART_API}/release/${releaseId}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    const frontImage =
      data.images?.find((img) => img.front && img.approved) ||
      data.images?.find((img) => img.approved) ||
      data.images?.[0];

    if (frontImage?.image) {
      return frontImage.image;
    }

    return null;
  } catch (error) {
    return null;
  }
}

// Download image from external URL and resize to 512x512
async function downloadAndProcessImage(imageUrl) {
  try {
    const response = await fetch(imageUrl);

    if (!response.ok) {
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const processedBuffer = await sharp(buffer)
      .resize(512, 512, { fit: "cover" })
      .jpeg({ quality: 80 })
      .toBuffer();

    return processedBuffer;
  } catch (error) {
    return null;
  }
}

// Upload processed image to Supabase Storage
async function uploadToSupabase(buffer, albumId) {
  try {
    const filePath = `albums/${albumId}.jpg`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("album_images")
      .upload(filePath, buffer, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      return null;
    }

    const { data } = supabaseAdmin.storage
      .from("album_images")
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    return null;
  }
}

async function fetchTracklist(releaseGroupId) {
  const rgUrl = `${MUSICBRAINZ_API}/release-group/${releaseGroupId}?inc=releases&fmt=json`;
  const rgData = await fetchMusicBrainz(rgUrl);

  if (!rgData.releases || rgData.releases.length === 0) {
    return { tracklist: [], releaseId: null };
  }

  const officialRelease =
    rgData.releases.find((r) => r.status === "Official") || rgData.releases[0];
  const releaseId = officialRelease.id;

  await sleep(1000);
  const releaseUrl = `${MUSICBRAINZ_API}/release/${releaseId}?inc=recordings&fmt=json`;
  const releaseData = await fetchMusicBrainz(releaseUrl);

  if (!releaseData.media || releaseData.media.length === 0) {
    return { tracklist: [], releaseId };
  }

  const tracklist = [];
  for (const medium of releaseData.media) {
    if (medium.tracks) {
      for (const track of medium.tracks) {
        tracklist.push(track.recording.title);
      }
    }
  }

  return { tracklist, releaseId };
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

    const { tracklist, releaseId } = await fetchTracklist(album.id);

    let externalImageUrl = null;
    if (releaseId) {
      externalImageUrl = await fetchAlbumCover(releaseId);
    }

    const { data: newAlbum, error: insertError } = await supabaseAdmin
      .from("artist_albums")
      .insert({
        name: album.title,
        album_image: null,
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
      return NextResponse.json(
        { error: "Failed to import album", details: insertError.message },
        { status: 500 }
      );
    }

    let albumImage = null;
    if (externalImageUrl && newAlbum.id) {
      const imageBuffer = await downloadAndProcessImage(externalImageUrl);
      if (imageBuffer) {
        albumImage = await uploadToSupabase(imageBuffer, newAlbum.id);

        if (albumImage) {
          await supabaseAdmin
            .from("artist_albums")
            .update({ album_image: albumImage })
            .eq("id", newAlbum.id);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Album "${album.title}" imported successfully`,
      album: { ...newAlbum, album_image: albumImage },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to import album",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
