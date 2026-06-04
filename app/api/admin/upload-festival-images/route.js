import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";
import { findFestivalImage } from "@/app/helpers/imageAutomation";
import { processAndUploadImage } from "@/app/lib/services/imageProcessing";
import fs from "fs";

export async function POST() {
  try {
    const { data: festivals, error: festivalsError } = await supabaseAdmin
      .from("festivals")
      .select("id, name, image_url")
      .eq("status", "pending");

    if (festivalsError) {
      return NextResponse.json(
        { error: "Failed to fetch festivals", details: festivalsError.message },
        { status: 500 },
      );
    }

    // Filter to only festivals with no usable image (null, empty object, or empty-string JSONB)
    const toProcess = (festivals || []).filter((f) => {
      if (!f.image_url) return true;
      if (
        typeof f.image_url === "string" &&
        (f.image_url === "{}" || f.image_url.trim() === "")
      )
        return true;
      if (
        typeof f.image_url === "object" &&
        !f.image_url.sm &&
        !f.image_url.md &&
        !f.image_url.lg
      )
        return true;
      return false;
    });

    if (toProcess.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No pending festivals without images found",
        processed: 0,
        results: [],
      });
    }

    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const festival of toProcess) {
      try {
        const imageInfo = findFestivalImage(festival.name);

        if (!imageInfo) {
          results.push({
            festivalId: festival.id,
            festivalName: festival.name,
            status: "failed",
            reason: "No matching image file found",
          });
          failCount++;
          continue;
        }

        const imageBuffer = fs.readFileSync(imageInfo.filePath);
        const randomId = Math.random().toString(36).substring(2, 15);
        const baseName = `festival_${Date.now()}_${randomId}`;

        let imageUrls;
        try {
          imageUrls = await processAndUploadImage(
            imageBuffer,
            supabaseAdmin,
            "festival_images",
            baseName,
          );
        } catch (uploadErr) {
          results.push({
            festivalId: festival.id,
            festivalName: festival.name,
            status: "failed",
            reason: `Upload failed: ${uploadErr.message}`,
          });
          failCount++;
          continue;
        }

        const { error: updateError } = await supabaseAdmin
          .from("festivals")
          .update({ image_url: imageUrls })
          .eq("id", festival.id);

        if (updateError) {
          results.push({
            festivalId: festival.id,
            festivalName: festival.name,
            status: "failed",
            reason: `Database update failed: ${updateError.message}`,
          });
          failCount++;
          continue;
        }

        results.push({
          festivalId: festival.id,
          festivalName: festival.name,
          status: "success",
          imageUrls,
          sourceFile: imageInfo.filename,
        });
        successCount++;
      } catch (error) {
        results.push({
          festivalId: festival.id,
          festivalName: festival.name,
          status: "failed",
          reason: error.message,
        });
        failCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${toProcess.length} festivals: ${successCount} successful, ${failCount} failed`,
      processed: toProcess.length,
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
    const { data: festivals, error: festivalsError } = await supabaseAdmin
      .from("festivals")
      .select("id, name, image_url")
      .eq("status", "pending");

    if (festivalsError) {
      return NextResponse.json(
        { error: festivalsError.message },
        { status: 500 },
      );
    }

    const toProcess = (festivals || []).filter((f) => {
      if (!f.image_url) return true;
      if (
        typeof f.image_url === "string" &&
        (f.image_url === "{}" || f.image_url.trim() === "")
      )
        return true;
      if (
        typeof f.image_url === "object" &&
        !f.image_url.sm &&
        !f.image_url.md &&
        !f.image_url.lg
      )
        return true;
      return false;
    });

    const preview = toProcess.map((festival) => {
      const imageInfo = findFestivalImage(festival.name);
      return {
        festivalId: festival.id,
        festivalName: festival.name,
        hasMatchingImage: !!imageInfo,
        imageFile: imageInfo ? imageInfo.filename : null,
      };
    });

    return NextResponse.json({
      totalPendingWithoutImages: toProcess.length,
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
