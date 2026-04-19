/**
 * POST /api/admin/optimize-images?type=artist|club|event|festival|all
 *
 * For every record that is "single" (sm=md=lg same URL) or "legacy" (plain
 * string), this route:
 *   1. Downloads the original image from the lg / string URL
 *   2. Generates sm (250px) and md (500px) JPEG variants via Sharp
 *   3. Uploads all 3 to the correct bucket
 *   4. Updates image_url in the DB with the new {sm, md, lg} JSONB
 *
 * Returns per-table stats: { success, failed, skipped, errors[] }
 *
 * Admin only.
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerUser, supabaseAdmin } from "@/app/lib/config/supabaseServer";
import {
  processAndUploadRemoteImage,
  deleteImageVariants,
} from "@/app/lib/services/imageProcessing";

const CONFIGS = {
  artists: {
    table: "artists",
    bucket: "artist_profile_images",
    nameCol: "name",
    baseNameFn: (row) => `artist_${row.id}_opt`,
  },
  clubs: {
    table: "clubs",
    bucket: "club_images",
    nameCol: "name",
    baseNameFn: (row) => `club_${row.id}_opt`,
  },
  events: {
    table: "events",
    bucket: "event_images",
    nameCol: "event_name",
    baseNameFn: (row) => `event_${row.id}_opt`,
  },
  festivals: {
    table: "festivals",
    bucket: "festival_images",
    nameCol: "name",
    baseNameFn: (row) => `festival_${row.id}_opt`,
  },
};

function needsOptimization(imageUrl) {
  if (!imageUrl) return false;
  // Legacy plain string
  if (typeof imageUrl === "string") return imageUrl.startsWith("http");
  // JSONB with all three pointing to the same URL (single image)
  if (typeof imageUrl === "object") {
    const { sm, md, lg } = imageUrl;
    if (!lg) return false;
    return sm === md && md === lg;
  }
  return false;
}

function getOriginalUrl(imageUrl) {
  if (typeof imageUrl === "string") return imageUrl;
  return imageUrl?.lg || imageUrl?.md || imageUrl?.sm || null;
}

async function optimizeTable(config) {
  const { table, bucket, baseNameFn } = config;
  const results = { success: 0, failed: 0, skipped: 0, errors: [] };

  // Paginate
  let from = 0;
  const PAGE = 500;
  const toProcess = [];

  while (true) {
    const { data, error } = await supabaseAdmin
      .from(table)
      .select("id, image_url")
      .not("image_url", "is", null)
      .range(from, from + PAGE - 1);

    if (error) throw new Error(`${table}: ${error.message}`);
    if (!data || data.length === 0) break;

    for (const row of data) {
      if (needsOptimization(row.image_url)) toProcess.push(row);
    }

    if (data.length < PAGE) break;
    from += PAGE;
  }

  console.log(`[optimize] ${table}: ${toProcess.length} records to optimize`);

  for (const row of toProcess) {
    const originalUrl = getOriginalUrl(row.image_url);
    if (!originalUrl) {
      results.skipped++;
      continue;
    }

    const baseName = baseNameFn(row);

    try {
      const imageUrls = await processAndUploadRemoteImage(
        originalUrl,
        supabaseAdmin,
        bucket,
        baseName,
      );

      // Best-effort delete of the old single file
      await deleteImageVariants(row.image_url, supabaseAdmin, bucket).catch(
        () => {},
      );

      const { error: updateError } = await supabaseAdmin
        .from(table)
        .update({ image_url: imageUrls })
        .eq("id", row.id);

      if (updateError) throw new Error(updateError.message);

      console.log(`[optimize] ${table} id=${row.id} ✓ sm/md/lg created`);
      results.success++;
    } catch (err) {
      console.error(`[optimize] ${table} id=${row.id} failed:`, err.message);
      results.failed++;
      results.errors.push({ id: row.id, error: err.message });
    }
  }

  return { ...results, total: toProcess.length };
}

export async function POST(request) {
  const cookieStore = await cookies();
  const { user, error: authError } = await getServerUser(cookieStore);
  if (authError || !user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.is_admin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "all";

  const keys =
    type === "all"
      ? Object.keys(CONFIGS)
      : type.split(",").filter((t) => t in CONFIGS);

  if (!keys.length) {
    return NextResponse.json(
      {
        error: `Unknown type "${type}". Use artists|clubs|events|festivals|all`,
      },
      { status: 400 },
    );
  }

  const summary = {};
  for (const key of keys) {
    console.log(`[optimize] Starting ${key}…`);
    try {
      summary[key] = await optimizeTable(CONFIGS[key]);
    } catch (err) {
      console.error(`[optimize] ${key} fatal:`, err.message);
      summary[key] = { error: err.message };
    }
    console.log(`[optimize] ${key} done:`, summary[key]);
  }

  return NextResponse.json({ success: true, summary });
}
