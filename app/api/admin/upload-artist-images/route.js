import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";
import { findArtistImage } from "@/app/helpers/imageAutomation";
import { processAndUploadImage } from "@/app/lib/services/imageProcessing";
import fs from "fs";

export async function POST(request) {
  try {
    // Get all pending artists without images
    const { data: artists, error: artistsError } = await supabaseAdmin
      .from("artists")
      .select("id, name, stage_name, image_url")
      .eq("status", "pending")
      .is("image_url", null);

    if (artistsError) {
      console.error("Error fetching artists:", artistsError);
      return NextResponse.json(
        { error: "Failed to fetch artists", details: artistsError.message },
        { status: 500 },
      );
    }

    if (!artists || artists.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No pending artists without images found",
        processed: 0,
        results: [],
      });
    }

    const results = [];
    let successCount = 0;
    let failCount = 0;

    // Process each artist
    for (const artist of artists) {
      try {
        // Find matching image file
        const imageInfo = findArtistImage(artist.name, artist.stage_name);

        if (!imageInfo) {
          results.push({
            artistId: artist.id,
            artistName: artist.name || artist.stage_name,
            status: "failed",
            reason: "No matching image file found",
          });
          failCount++;
          continue;
        }

        // Read the image file
        const imageBuffer = fs.readFileSync(imageInfo.filePath);

        // Generate base name for storage variants
        const randomId = Math.random().toString(36).substring(2, 15);
        const baseName = `artist_${Date.now()}_${randomId}`;

        // Process into sm/md/lg and upload all 3 variants
        let imageUrls;
        try {
          imageUrls = await processAndUploadImage(
            imageBuffer,
            supabaseAdmin,
            "artist_profile_images",
            baseName,
          );
        } catch (uploadErr) {
          console.error(`Upload error for ${artist.name}:`, uploadErr);
          results.push({
            artistId: artist.id,
            artistName: artist.name || artist.stage_name,
            status: "failed",
            reason: `Upload failed: ${uploadErr.message}`,
          });
          failCount++;
          continue;
        }

        // Update artist record with JSONB image_url
        const { error: updateError } = await supabaseAdmin
          .from("artists")
          .update({ image_url: imageUrls })
          .eq("id", artist.id);

        if (updateError) {
          console.error(`Update error for ${artist.name}:`, updateError);
          results.push({
            artistId: artist.id,
            artistName: artist.name || artist.stage_name,
            status: "failed",
            reason: `Database update failed: ${updateError.message}`,
          });
          failCount++;
          continue;
        }

        results.push({
          artistId: artist.id,
          artistName: artist.name || artist.stage_name,
          status: "success",
          imageUrls,
          sourceFile: imageInfo.filename,
        });
        successCount++;
      } catch (error) {
        console.error(`Error processing artist ${artist.name}:`, error);
        results.push({
          artistId: artist.id,
          artistName: artist.name || artist.stage_name,
          status: "failed",
          reason: error.message,
        });
        failCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${artists.length} artists: ${successCount} successful, ${failCount} failed`,
      processed: artists.length,
      successCount,
      failCount,
      results,
    });
  } catch (error) {
    console.error("Automation error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    );
  }
}

// GET endpoint to preview what will be processed
export async function GET(request) {
  try {
    const { data: artists, error: artistsError } = await supabaseAdmin
      .from("artists")
      .select("id, name, stage_name, image_url")
      .eq("status", "pending")
      .is("image_url", null);

    if (artistsError) {
      return NextResponse.json(
        { error: artistsError.message },
        { status: 500 },
      );
    }

    const preview = artists.map((artist) => {
      const imageInfo = findArtistImage(artist.name, artist.stage_name);
      return {
        artistId: artist.id,
        artistName: artist.name || artist.stage_name,
        hasMatchingImage: !!imageInfo,
        imageFile: imageInfo ? imageInfo.filename : null,
      };
    });

    return NextResponse.json({
      totalPendingWithoutImages: artists.length,
      withMatchingImages: preview.filter((p) => p.hasMatchingImage).length,
      withoutMatchingImages: preview.filter((p) => !p.hasMatchingImage).length,
      preview,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    );
  }
}
