import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  getBranding,
  updateBranding,
  uploadPosterImage,
} from "@/app/lib/services/admin/branding";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const data = await getBranding();
    return NextResponse.json(
      { success: true, data },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: err.status || 500 },
    );
  }
}

export async function PATCH(request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    // Unified submit: multipart/form-data (may or may not include a file)
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const brandingId = formData.get("id");
      const episodeRaw = formData.get("episode_number");
      const tracklistRaw = formData.get("tracklist");
      const file = formData.get("poster_url");

      // Text-field updates
      const updates = {};
      if (episodeRaw !== null && episodeRaw !== "")
        updates.episode_number = Number(episodeRaw);
      if (tracklistRaw !== null) {
        try {
          updates.tracklist = JSON.parse(tracklistRaw);
        } catch {
          updates.tracklist = [];
        }
      }

      let latest;

      if (file instanceof File && file.size > 0) {
        // Upload image first, which also saves the row
        latest = await uploadPosterImage(file, brandingId);
        // Apply any remaining text updates on top
        if (Object.keys(updates).length > 0) {
          latest = await updateBranding(updates);
        }
      } else {
        latest = await updateBranding(updates);
      }

      revalidatePath("/administration/branding");

      return NextResponse.json({ success: true, data: latest });
    }

    // JSON update (positions, or any other field)
    const body = await request.json();
    const data = await updateBranding(body);
    revalidatePath("/administration/branding");
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: err.status || 500 },
    );
  }
}
