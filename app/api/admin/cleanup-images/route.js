/**
 * GET  /api/admin/cleanup-images
 *   → returns { buckets: { [bucketName]: string[] } }  (file paths of orphaned files)
 *
 * DELETE /api/admin/cleanup-images
 *   body: { buckets: { [bucketName]: string[] } }
 *   → deletes the listed files from each bucket
 *   → returns { deleted: number, errors: string[] }
 *
 * Admin only.
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerUser } from "@/app/lib/config/supabaseServer";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";

// ── Bucket → DB lookup config ─────────────────────────────────────────────────
// For JSONB columns (image_url) we extract all values from the object.
// For TEXT columns we collect the raw URL string.
const BUCKET_CONFIGS = {
  artist_profile_images: {
    table: "artists",
    column: "image_url",
    type: "jsonb",
  },
  club_images: {
    table: "clubs",
    column: "image_url",
    type: "jsonb",
  },
  event_images: {
    table: "events",
    column: "image_url",
    type: "jsonb",
  },
  festival_images: {
    table: "festivals",
    column: "image_url",
    type: "jsonb",
  },
  album_images: {
    table: "artist_albums",
    column: "album_image",
    type: "text",
  },
  news_images: {
    table: "news",
    column: "news_image",
    type: "text",
  },
  profile_images: {
    table: "users",
    column: "user_avatar",
    type: "text",
  },
};

/** Extract the storage object path from a public URL */
function extractPath(url, bucket) {
  if (!url || typeof url !== "string") return null;
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  return idx !== -1 ? url.slice(idx + marker.length) : null;
}

/** Fetch all file paths currently referenced in the DB for a given bucket */
async function getUsedPaths(bucketName) {
  const config = BUCKET_CONFIGS[bucketName];
  if (!config) return new Set();

  const used = new Set();

  // Paginate to handle large tables
  let from = 0;
  const PAGE = 1000;

  while (true) {
    const { data, error } = await supabaseAdmin
      .from(config.table)
      .select(config.column)
      .range(from, from + PAGE - 1);

    if (error || !data || data.length === 0) break;

    for (const row of data) {
      const val = row[config.column];
      if (!val) continue;

      if (config.type === "jsonb" && typeof val === "object") {
        for (const url of Object.values(val)) {
          const p = extractPath(url, bucketName);
          if (p) used.add(p);
        }
      } else if (config.type === "jsonb" && typeof val === "string") {
        // legacy string fallback
        const p = extractPath(val, bucketName);
        if (p) used.add(p);
      } else if (typeof val === "string") {
        const p = extractPath(val, bucketName);
        if (p) used.add(p);
      }
    }

    if (data.length < PAGE) break;
    from += PAGE;
  }

  return used;
}

/** List all files in a bucket (paginates through storage listing) */
async function listAllBucketFiles(bucketName) {
  const files = [];
  let offset = 0;
  const PAGE = 1000;

  while (true) {
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .list("", { limit: PAGE, offset });

    if (error || !data || data.length === 0) break;

    // Supabase storage list returns objects — filter out "folder" placeholders
    for (const item of data) {
      if (item.name && item.id) {
        files.push(item.name);
      }
    }

    if (data.length < PAGE) break;
    offset += PAGE;
  }

  return files;
}

async function requireAdmin(cookieStore) {
  const { user, error } = await getServerUser(cookieStore);
  if (error || !user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (!user.is_admin) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { ok: true };
}

// ── GET: find orphaned files ───────────────────────────────────────────────────
export async function GET(request) {
  const cookieStore = await cookies();
  const auth = await requireAdmin(cookieStore);
  if (!auth.ok) return auth.response;

  const result = {};
  const summary = {};

  for (const bucketName of Object.keys(BUCKET_CONFIGS)) {
    try {
      const [allFiles, usedPaths] = await Promise.all([
        listAllBucketFiles(bucketName),
        getUsedPaths(bucketName),
      ]);

      const orphans = allFiles.filter((f) => !usedPaths.has(f));
      result[bucketName] = orphans;
      summary[bucketName] = { total: allFiles.length, orphans: orphans.length };
    } catch (err) {
      console.error(`[cleanup-images] Error scanning ${bucketName}:`, err);
      result[bucketName] = [];
      summary[bucketName] = { error: err.message };
    }
  }

  return NextResponse.json({ buckets: result, summary });
}

// ── DELETE: remove the listed orphaned files ───────────────────────────────────
export async function DELETE(request) {
  const cookieStore = await cookies();
  const auth = await requireAdmin(cookieStore);
  if (!auth.ok) return auth.response;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { buckets } = body; // { [bucketName]: string[] }
  if (!buckets || typeof buckets !== "object") {
    return NextResponse.json(
      { error: "buckets field required" },
      { status: 400 },
    );
  }

  let totalDeleted = 0;
  const errors = [];

  for (const [bucketName, files] of Object.entries(buckets)) {
    if (!Array.isArray(files) || files.length === 0) continue;
    if (!BUCKET_CONFIGS[bucketName]) {
      errors.push(`Unknown bucket: ${bucketName}`);
      continue;
    }

    // Supabase storage remove accepts up to 1000 paths per call
    const CHUNK = 100;
    for (let i = 0; i < files.length; i += CHUNK) {
      const chunk = files.slice(i, i + CHUNK);
      const { error } = await supabaseAdmin.storage
        .from(bucketName)
        .remove(chunk);
      if (error) {
        errors.push(`${bucketName}: ${error.message}`);
      } else {
        totalDeleted += chunk.length;
      }
    }
  }

  console.log(
    `[cleanup-images] Deleted ${totalDeleted} orphaned files. Errors:`,
    errors,
  );

  return NextResponse.json({ deleted: totalDeleted, errors });
}
