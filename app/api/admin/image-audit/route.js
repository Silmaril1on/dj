/**
 * GET /api/admin/image-audit
 *
 * Audits the artists table (and optionally clubs/events/festivals) and
 * classifies each row's image_url JSONB into one of:
 *
 *   "optimized"   – sm, md, lg are all present AND all different URLs
 *   "single"      – sm === md === lg (same URL repeated, no real variants)
 *   "legacy"      – image_url is a plain string (pre-migration)
 *   "missing"     – image_url is null / empty
 *
 * Returns per-table stats + the list of rows that still need optimisation.
 *
 * Admin only.
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerUser, supabaseAdmin } from "@/app/lib/config/supabaseServer";

const TABLES = {
  artists: {
    label: "Artists",
    table: "artists",
    column: "image_url",
    nameCol: "name",
    bucket: "artist_profile_images",
  },
  clubs: {
    label: "Clubs",
    table: "clubs",
    column: "image_url",
    nameCol: "name",
    bucket: "club_images",
  },
  events: {
    label: "Events",
    table: "events",
    column: "image_url",
    nameCol: "event_name",
    bucket: "event_images",
  },
  festivals: {
    label: "Festivals",
    table: "festivals",
    column: "image_url",
    nameCol: "name",
    bucket: "festival_images",
  },
};

function classifyImageUrl(imageUrl) {
  if (!imageUrl) return "missing";
  if (typeof imageUrl === "string") return "legacy";
  if (typeof imageUrl !== "object") return "missing";

  const { sm, md, lg } = imageUrl;
  if (!sm || !md || !lg) return "single"; // incomplete
  if (sm === md && md === lg) return "single"; // same URL repeated
  return "optimized";
}

async function auditTable({ table, column, nameCol }) {
  const PAGE = 1000;
  let from = 0;
  const rows = [];

  while (true) {
    const { data, error } = await supabaseAdmin
      .from(table)
      .select(`id, ${nameCol}, ${column}`)
      .range(from, from + PAGE - 1);

    if (error) throw new Error(`${table}: ${error.message}`);
    if (!data || data.length === 0) break;

    rows.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }

  const stats = {
    total: rows.length,
    optimized: 0,
    single: 0,
    legacy: 0,
    missing: 0,
  };
  const needsOptimization = []; // rows classified as "single" or "legacy"
  const optimizedRows = []; // rows already fully optimized

  for (const row of rows) {
    const status = classifyImageUrl(row[column]);
    stats[status]++;
    if (status === "single" || status === "legacy") {
      needsOptimization.push({
        id: row.id,
        name: row[nameCol] || row.id,
        status,
        imageUrl: row[column],
      });
    }
    if (status === "optimized") {
      optimizedRows.push({
        id: row.id,
        name: row[nameCol] || row.id,
        imageUrl: row[column],
      });
    }
  }

  return { stats, needsOptimization, optimizedRows };
}

export async function GET() {
  const cookieStore = await cookies();
  const { user, error } = await getServerUser(cookieStore);
  if (error || !user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.is_admin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const results = {};

  for (const [key, config] of Object.entries(TABLES)) {
    try {
      results[key] = await auditTable(config);
      results[key].label = config.label;
      results[key].bucket = config.bucket;
    } catch (err) {
      console.error(`[image-audit] ${key} failed:`, err.message);
      results[key] = { error: err.message, label: config.label };
    }
  }

  return NextResponse.json(results);
}
