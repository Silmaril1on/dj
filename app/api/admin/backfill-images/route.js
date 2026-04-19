/**
 * POST /api/admin/backfill-images
 *
 * One-time migration route: for every existing artist / club / festival / event
 * that still has a legacy string URL in image_url (i.e. not a JSONB object),
 * this downloads the original image, creates sm/md/lg variants via Sharp,
 * uploads them to the same bucket, and stores the JSON object.
 *
 * Call with ?type=artist|club|festival|event to process one table at a time.
 * Call with ?type=all to process all four tables sequentially.
 *
 * Protected: admin only.
 */
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";
import {
  processAndUploadRemoteImage,
  deleteImageVariants,
} from "@/app/lib/services/imageProcessing";

// ── config per entity ────────────────────────────────────────────────────────
const CONFIGS = {
  artist: {
    table: "artists",
    imageField: "image_url", // new unified column name
    bucket: "artist_profile_images",
    baseNameFn: (row) => `artist_${row.id}_backfill`,
  },
  club: {
    table: "clubs",
    imageField: "image_url",
    bucket: "club_images",
    baseNameFn: (row) => `club_${row.id}_backfill`,
  },
  festival: {
    table: "festivals",
    imageField: "image_url",
    bucket: "festival_images",
    baseNameFn: (row) => `festival_${row.id}_backfill`,
  },
  event: {
    table: "events",
    imageField: "image_url",
    bucket: "event_images",
    baseNameFn: (row) => `event_${row.id}_backfill`,
  },
};

async function backfillTable(config, { dryRun = false } = {}) {
  const { table, imageField, bucket, baseNameFn } = config;

  // Fetch all rows where image_url is a string (legacy), i.e. not yet a JSONB object.
  // In Postgres: jsonb columns store objects, so we look for rows where
  // the value is a JSON string primitive (not an object).
  const { data: rows, error } = await supabaseAdmin
    .from(table)
    .select(`id, ${imageField}`)
    .not(imageField, "is", null);

  if (error) throw new Error(`Failed to fetch ${table}: ${error.message}`);

  // Filter to only rows that still hold a plain string URL
  const legacy = (rows || []).filter(
    (r) =>
      typeof r[imageField] === "string" && r[imageField].startsWith("http"),
  );

  const results = {
    total: legacy.length,
    success: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  if (dryRun) {
    results.dryRun = true;
    return results;
  }

  for (const row of legacy) {
    const originalUrl = row[imageField];
    const baseName = baseNameFn(row);

    try {
      // Download + resize + upload 3 variants
      const imageUrls = await processAndUploadRemoteImage(
        originalUrl,
        supabaseAdmin,
        bucket,
        baseName,
      );

      // Delete the old single-file (best-effort — it's the original lg)
      await deleteImageVariants(originalUrl, supabaseAdmin, bucket).catch(
        () => {},
      );

      // Write the JSONB object back
      const { error: updateError } = await supabaseAdmin
        .from(table)
        .update({ [imageField]: imageUrls })
        .eq("id", row.id);

      if (updateError) throw new Error(updateError.message);

      results.success++;
    } catch (err) {
      console.error(`[backfill] ${table} id=${row.id} failed:`, err.message);
      results.failed++;
      results.errors.push({ id: row.id, error: err.message });
    }
  }

  return results;
}

export async function POST(request) {
  try {
    // Verify admin via service-role key presence (this route uses supabaseAdmin)
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all";
    const dryRun = searchParams.get("dry") === "true";

    const types =
      type === "all"
        ? Object.keys(CONFIGS)
        : type.split(",").filter((t) => t in CONFIGS);

    if (!types.length) {
      return NextResponse.json(
        { error: `Unknown type "${type}". Use artist|club|festival|event|all` },
        { status: 400 },
      );
    }

    const summary = {};
    for (const t of types) {
      console.log(`[backfill] Starting ${t}...`);
      summary[t] = await backfillTable(CONFIGS[t], { dryRun });
      console.log(`[backfill] ${t} done:`, summary[t]);
    }

    return NextResponse.json({ success: true, dryRun, summary });
  } catch (err) {
    console.error("[backfill] Unexpected error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "all";

  const types =
    type === "all"
      ? Object.keys(CONFIGS)
      : type.split(",").filter((t) => t in CONFIGS);

  const preview = {};
  for (const t of types) {
    const { table, imageField } = CONFIGS[t];
    const { data, error } = await supabaseAdmin
      .from(table)
      .select(`id, ${imageField}`)
      .not(imageField, "is", null);

    if (error) {
      preview[t] = { error: error.message };
      continue;
    }

    const legacy = (data || []).filter(
      (r) =>
        typeof r[imageField] === "string" && r[imageField].startsWith("http"),
    );
    const migrated = (data || []).filter(
      (r) => typeof r[imageField] === "object",
    );

    preview[t] = {
      total: (data || []).length,
      legacyStringUrl: legacy.length,
      alreadyMigrated: migrated.length,
    };
  }

  return NextResponse.json({ preview });
}
