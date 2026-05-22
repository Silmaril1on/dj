import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";
import { findClubImage } from "@/app/helpers/imageAutomation";
import { processAndUploadImage } from "@/app/lib/services/imageProcessing";
import fs from "fs";

export async function POST() {
  try {
    const { data: clubs, error: clubsError } = await supabaseAdmin
      .from("clubs")
      .select("id, name, image_url")
      .eq("status", "pending")
      .is("image_url", null);

    if (clubsError) {
      return NextResponse.json(
        { error: "Failed to fetch clubs", details: clubsError.message },
        { status: 500 },
      );
    }

    if (!clubs || clubs.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No pending clubs without images found",
        processed: 0,
        results: [],
      });
    }

    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const club of clubs) {
      try {
        const imageInfo = findClubImage(club.name);

        if (!imageInfo) {
          results.push({
            clubId: club.id,
            clubName: club.name,
            status: "failed",
            reason: "No matching image file found",
          });
          failCount++;
          continue;
        }

        const imageBuffer = fs.readFileSync(imageInfo.filePath);
        const randomId = Math.random().toString(36).substring(2, 15);
        const baseName = `club_${Date.now()}_${randomId}`;

        let imageUrls;
        try {
          imageUrls = await processAndUploadImage(
            imageBuffer,
            supabaseAdmin,
            "club_images",
            baseName,
          );
        } catch (uploadErr) {
          results.push({
            clubId: club.id,
            clubName: club.name,
            status: "failed",
            reason: `Upload failed: ${uploadErr.message}`,
          });
          failCount++;
          continue;
        }

        const { error: updateError } = await supabaseAdmin
          .from("clubs")
          .update({ image_url: imageUrls })
          .eq("id", club.id);

        if (updateError) {
          results.push({
            clubId: club.id,
            clubName: club.name,
            status: "failed",
            reason: `Database update failed: ${updateError.message}`,
          });
          failCount++;
          continue;
        }

        results.push({
          clubId: club.id,
          clubName: club.name,
          status: "success",
          imageUrls,
          sourceFile: imageInfo.filename,
        });
        successCount++;
      } catch (error) {
        results.push({
          clubId: club.id,
          clubName: club.name,
          status: "failed",
          reason: error.message,
        });
        failCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${clubs.length} clubs: ${successCount} successful, ${failCount} failed`,
      processed: clubs.length,
      successCount,
      failCount,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const { data: clubs, error: clubsError } = await supabaseAdmin
      .from("clubs")
      .select("id, name, image_url")
      .eq("status", "pending")
      .is("image_url", null);

    if (clubsError) {
      return NextResponse.json({ error: clubsError.message }, { status: 500 });
    }

    const preview = (clubs || []).map((club) => {
      const imageInfo = findClubImage(club.name);
      return {
        clubId: club.id,
        clubName: club.name,
        hasMatchingImage: !!imageInfo,
        imageFile: imageInfo ? imageInfo.filename : null,
      };
    });

    return NextResponse.json({
      totalPendingWithoutImages: clubs?.length || 0,
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
