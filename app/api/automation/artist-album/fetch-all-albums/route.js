import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerUser, supabaseAdmin } from "@/app/lib/config/supabaseServer";
import sharp from "sharp";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const MUSICBRAINZ_API = "https://musicbrainz.org/ws/2";
const COVERART_API = "https://coverartarchive.org";
const USER_AGENT = "DJApp/1.0.0 (contact@djapp.com)";

// Normalize date to PostgreSQL-compatible format
function normalizeDateFormat(dateString) {
  if (!dateString) return null;

  // If it's just a year (e.g., "1974")
  if (/^\d{4}$/.test(dateString)) {
    return `${dateString}-01-01`;
  }

  // If it's year-month (e.g., "1973-05")
  if (/^\d{4}-\d{2}$/.test(dateString)) {
    return `${dateString}-01`;
  }

  // If it's already full date format (e.g., "1973-05-15")
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }

  // Return null for any other format
  return null;
}

async function fetchMusicBrainz(url) {
  await sleep(1000); // MusicBrainz rate limiting
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

async function getMusicBrainzArtistId(artistName) {
  const query = encodeURIComponent(artistName);
  const url = `${MUSICBRAINZ_API}/artist/?query=artist:${query}&fmt=json`;

  const data = await fetchMusicBrainz(url);

  if (!data.artists || data.artists.length === 0) {
    return null;
  }

  const bestMatch = data.artists[0];
  return {
    id: bestMatch.id,
    name: bestMatch.name,
    score: bestMatch.score || 0,
  };
}

async function fetchAlbumsFromMusicBrainz(mbid) {
  const url = `${MUSICBRAINZ_API}/release-group?artist=${mbid}&type=album&fmt=json&limit=100`;
  const data = await fetchMusicBrainz(url);

  if (!data["release-groups"] || data["release-groups"].length === 0) {
    return [];
  }

  // Filter to only include Albums (not EPs, Singles, etc.)
  return data["release-groups"]
    .filter((rg) => rg["primary-type"] === "Album")
    .map((rg) => ({
      id: rg.id,
      title: rg.title,
      primaryType: rg["primary-type"] || "Unknown",
      releaseDate: rg["first-release-date"] || null,
    }));
}

async function fetchAlbumCover(releaseGroupId) {
  try {
    const rgUrl = `${MUSICBRAINZ_API}/release-group/${releaseGroupId}?inc=releases&fmt=json`;
    await sleep(1000);

    const response = await fetch(rgUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    const rgData = await response.json();

    if (!rgData.releases || rgData.releases.length === 0) {
      return null;
    }

    const releaseId = rgData.releases[0].id;

    const coverUrl = `${COVERART_API}/release/${releaseId}`;
    const coverResponse = await fetch(coverUrl);

    if (!coverResponse.ok) {
      return null;
    }

    const coverData = await coverResponse.json();

    const frontImage =
      coverData.images?.find((img) => img.front && img.approved) ||
      coverData.images?.find((img) => img.approved) ||
      coverData.images?.[0];

    return frontImage?.image || null;
  } catch (error) {
    return null;
  }
}

async function fetchTracklist(releaseGroupId) {
  try {
    const rgUrl = `${MUSICBRAINZ_API}/release-group/${releaseGroupId}?inc=releases&fmt=json`;
    await sleep(1000);

    const response = await fetch(rgUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return [];
    }

    const rgData = await response.json();

    if (!rgData.releases || rgData.releases.length === 0) {
      return [];
    }

    const officialRelease =
      rgData.releases.find((r) => r.status === "Official") ||
      rgData.releases[0];
    const releaseId = officialRelease.id;

    await sleep(1000);
    const releaseUrl = `${MUSICBRAINZ_API}/release/${releaseId}?inc=recordings&fmt=json`;
    const releaseResponse = await fetch(releaseUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
    });

    if (!releaseResponse.ok) {
      return [];
    }

    const releaseData = await releaseResponse.json();

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
  } catch (error) {
    return [];
  }
}

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

async function importAlbumToDatabase(artistId, album) {
  try {
    // First, check if the album already exists
    const { data: existingAlbum } = await supabaseAdmin
      .from("artist_albums")
      .select("id")
      .eq("artist_id", artistId)
      .eq("musicbrainz_release_group_id", album.id)
      .single();

    if (existingAlbum) {
      return { success: false, reason: "already_exists" };
    }

    // Fetch tracklist
    console.log("      [FETCH] Fetching tracklist...");
    const tracklist = await fetchTracklist(album.id);

    // Fetch album cover
    const albumCoverUrl = await fetchAlbumCover(album.id);
    let uploadedImageUrl = null;

    if (albumCoverUrl) {
      const imageBuffer = await downloadAndProcessImage(albumCoverUrl);
      if (imageBuffer) {
        uploadedImageUrl = await uploadToSupabase(imageBuffer, album.id);
      }
    }

    // Normalize release date to valid PostgreSQL date format
    const normalizedDate = normalizeDateFormat(album.releaseDate);

    // Insert album into database
    const { data: insertedAlbum, error: insertError } = await supabaseAdmin
      .from("artist_albums")
      .insert({
        artist_id: artistId,
        name: album.title,
        release_date: normalizedDate,
        musicbrainz_release_group_id: album.id,
        album_image: uploadedImageUrl,
        description: `${album.primaryType} - ${album.title}`,
        tracklist: tracklist.length > 0 ? tracklist : null,
        user_id: null,
      })
      .select()
      .single();

    if (insertError) {
      console.log("      [DB_ERROR] " + insertError.message);
      return { success: false, reason: "db_error", error: insertError.message };
    }

    const trackCount = tracklist.length;
    console.log("      [INFO] Imported with " + trackCount + " tracks");

    return { success: true, album: insertedAlbum, trackCount };
  } catch (error) {
    return { success: false, reason: "exception", error: error.message };
  }
}

export async function POST(request) {
  try {
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

    console.log(
      "\n[START] Starting automatic album fetching for all artists..."
    );

    // Fetch all artists from database
    const { data: artists, error: artistsError } = await supabaseAdmin
      .from("artists")
      .select("id, name, stage_name")
      .order("name");

    if (artistsError) {
      return NextResponse.json(
        { error: "Failed to fetch artists", details: artistsError },
        { status: 500 }
      );
    }

    if (!artists || artists.length === 0) {
      console.log("[ERROR] No artists found in database");
      return NextResponse.json({
        success: true,
        message: "No artists found in database",
        report: {
          totalArtists: 0,
          processed: 0,
          withAlbumsImported: [],
          noAlbumsFound: [],
          alreadyHadAlbums: [],
          errors: [],
        },
      });
    }

    console.log("[INFO] Found " + artists.length + " artists in database");
    console.log("=".repeat(80));

    const report = {
      totalArtists: artists.length,
      processed: 0,
      withAlbumsImported: [],
      noAlbumsFound: [],
      alreadyHadAlbums: [],
      errors: [],
    };

    // Process each artist
    for (const artist of artists) {
      try {
        report.processed++;
        const artistName = artist.stage_name || artist.name;
        console.log(
          "\n[" +
            report.processed +
            "/" +
            artists.length +
            "] Processing: " +
            artistName
        );

        // Check if artist already has albums
        const { data: existingAlbums, error: checkError } = await supabaseAdmin
          .from("artist_albums")
          .select("id")
          .eq("artist_id", artist.id);

        if (checkError) {
          console.log("  [ERROR] Error checking existing albums");
          report.errors.push({
            artistId: artist.id,
            artistName: artist.stage_name || artist.name,
            error: "Failed to check existing albums",
          });
          continue;
        }

        if (existingAlbums && existingAlbums.length > 0) {
          console.log(
            "  [INFO] Already has " +
              existingAlbums.length +
              " albums - skipping"
          );
          report.alreadyHadAlbums.push({
            artistId: artist.id,
            artistName: artist.stage_name || artist.name,
            existingAlbumsCount: existingAlbums.length,
          });
          continue;
        }

        // Get MusicBrainz ID for this artist
        const searchName = artist.stage_name || artist.name;
        console.log("  [SEARCH] Searching MusicBrainz for: " + searchName);
        const mbArtist = await getMusicBrainzArtistId(searchName);

        if (!mbArtist) {
          console.log("  [WARN] Not found in MusicBrainz");
          report.noAlbumsFound.push({
            artistId: artist.id,
            artistName: searchName,
            reason: "Artist not found in MusicBrainz",
          });
          continue;
        }

        console.log(
          "  [SUCCESS] Found in MusicBrainz (score: " + mbArtist.score + ")"
        );
        console.log("  [FETCH] Fetching albums...");

        // Fetch albums from MusicBrainz
        const albums = await fetchAlbumsFromMusicBrainz(mbArtist.id);

        if (!albums || albums.length === 0) {
          console.log("  [WARN] No albums found");
          report.noAlbumsFound.push({
            artistId: artist.id,
            artistName: searchName,
            reason: "No albums found in MusicBrainz",
          });
          continue;
        }

        console.log("  [INFO] Found " + albums.length + " albums");

        // Import each album
        const importedAlbums = [];
        for (let i = 0; i < albums.length; i++) {
          const album = albums[i];
          console.log(
            "    [" +
              (i + 1) +
              "/" +
              albums.length +
              "] Importing: " +
              album.title +
              " (" +
              album.primaryType +
              ")"
          );
          const result = await importAlbumToDatabase(artist.id, album);

          if (result.success) {
            console.log("      [SUCCESS] Successfully imported");
            importedAlbums.push({
              albumName: album.title,
              releaseDate: album.releaseDate,
              albumType: album.primaryType,
            });
          } else {
            const errorDetail = result.error ? " - " + result.error : "";
            console.log(
              "      [SKIP] Skipped (" + result.reason + ")" + errorDetail
            );
          }
        }

        if (importedAlbums.length > 0) {
          console.log(
            "  [SUCCESS] Successfully imported " +
              importedAlbums.length +
              " albums for " +
              searchName
          );
          report.withAlbumsImported.push({
            artistId: artist.id,
            artistName: searchName,
            albumsCount: importedAlbums.length,
            albums: importedAlbums,
          });
        } else {
          console.log("  [WARN] No new albums imported (may already exist)");
          report.noAlbumsFound.push({
            artistId: artist.id,
            artistName: searchName,
            reason: "Albums found but not imported (may already exist)",
          });
        }
      } catch (error) {
        console.log("  [ERROR] Error: " + error.message);
        report.errors.push({
          artistId: artist.id,
          artistName: artist.stage_name || artist.name,
          error: error.message,
        });
      }
    }

    console.log("\n" + "=".repeat(80));
    console.log("\n[COMPLETE] AUTOMATION COMPLETE!");
    console.log("\n[SUMMARY]");
    console.log("   - Total Artists: " + report.totalArtists);
    console.log("   - Processed: " + report.processed);
    console.log(
      "   - With Albums Imported: " + report.withAlbumsImported.length
    );
    console.log("   - Already Had Albums: " + report.alreadyHadAlbums.length);
    console.log("   - No Albums Found: " + report.noAlbumsFound.length);
    console.log("   - Errors: " + report.errors.length);
    console.log("\n" + "=".repeat(80));

    return NextResponse.json({
      success: true,
      message: "Automatic album fetching completed",
      report,
    });
  } catch (error) {
    console.error("\n[FATAL ERROR]", error);
    return NextResponse.json(
      { error: "Server error", details: error.message },
      { status: 500 }
    );
  }
}
