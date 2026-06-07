import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { unstable_cache } from "next/cache";
import { getServerUser, supabaseAdmin } from "@/app/lib/config/supabaseServer";

export const AUDIT_CACHE_SECONDS = 60 * 60 * 24;

export function cacheAuditData(key, fetcher) {
  return unstable_cache(fetcher, ["admin-audit", key], {
    revalidate: AUDIT_CACHE_SECONDS,
    tags: [`admin-audit-${key}`],
  });
}

export async function requireAuditAdmin() {
  const cookieStore = await cookies();
  const { user, error } = await getServerUser(cookieStore);

  if (error || !user || !user.is_admin) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 403 }),
    };
  }

  return { user };
}

export function periodStart(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

export async function countWhere(table, filters = {}) {
  let query = supabaseAdmin
    .from(table)
    .select("*", { count: "exact", head: true });

  for (const [column, value] of Object.entries(filters)) {
    if (value !== undefined) query = query.eq(column, value);
  }

  const { count, error } = await query;
  if (error) throw new Error(`${table} count: ${error.message}`);
  return count ?? 0;
}

export async function countSince(table, column, iso, extraFilters = {}) {
  let query = supabaseAdmin
    .from(table)
    .select("*", { count: "exact", head: true })
    .gte(column, iso);

  for (const [key, value] of Object.entries(extraFilters)) {
    query = query.eq(key, value);
  }

  const { count, error } = await query;
  if (error) throw new Error(`${table} since ${iso}: ${error.message}`);
  return count ?? 0;
}

export async function imageStats(table) {
  const pageSize = 1000;
  let from = 0;
  let missing = 0;
  let legacy = 0;
  let single = 0;
  let optimized = 0;
  let total = 0;

  while (true) {
    const { data, error } = await supabaseAdmin
      .from(table)
      .select("image_url")
      .range(from, from + pageSize - 1);

    if (error) throw new Error(`${table} image stats: ${error.message}`);
    if (!data?.length) break;

    for (const row of data) {
      total++;
      const image = row.image_url;

      if (!image) {
        missing++;
        continue;
      }

      if (typeof image === "string") {
        legacy++;
        continue;
      }

      const { sm, md, lg } = image;
      if (!sm && !md && !lg) {
        missing++;
      } else if (sm === md && md === lg) {
        single++;
      } else {
        optimized++;
      }
    }

    if (data.length < pageSize) break;
    from += pageSize;
  }

  return { total, missing, legacy, single, optimized };
}

const IMAGE_EXTENSIONS = new Set([
  "avif",
  "gif",
  "jpeg",
  "jpg",
  "png",
  "webp",
]);

function isImageObject(file) {
  const mime = file?.metadata?.mimetype || file?.metadata?.mimeType || "";
  if (mime.startsWith("image/")) return true;

  const extension = file?.name?.split(".").pop()?.toLowerCase();
  return IMAGE_EXTENSIONS.has(extension);
}

async function listStoragePath(bucketName, path = "") {
  const limit = 1000;
  let offset = 0;
  let imageCount = 0;
  let totalBytes = 0;

  while (true) {
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .list(path, {
        limit,
        offset,
        sortBy: { column: "name", order: "asc" },
      });

    if (error) throw new Error(`${bucketName} storage list: ${error.message}`);
    if (!data?.length) break;

    for (const item of data) {
      const itemPath = path ? `${path}/${item.name}` : item.name;
      const isFolder = !item.id && !item.metadata?.size;

      if (isFolder) {
        const nested = await listStoragePath(bucketName, itemPath);
        imageCount += nested.imageCount;
        totalBytes += nested.totalBytes;
        continue;
      }

      const size = Number(item.metadata?.size) || 0;
      if (isImageObject(item)) {
        imageCount++;
        totalBytes += size;
      }
    }

    if (data.length < limit) break;
    offset += limit;
  }

  return { imageCount, totalBytes };
}

export async function bucketStorageStats() {
  const { data: buckets, error } = await supabaseAdmin.storage.listBuckets();
  if (error) throw new Error(`storage buckets: ${error.message}`);

  const bucketStats = await Promise.all(
    (buckets || []).map(async (bucket) => {
      const stats = await listStoragePath(bucket.name).catch(() => ({
        imageCount: 0,
        totalBytes: 0,
      }));

      return {
        name: bucket.name,
        public: bucket.public ?? false,
        ...stats,
      };
    }),
  );

  return {
    totalBytes: bucketStats.reduce((sum, bucket) => sum + bucket.totalBytes, 0),
    imageCount: bucketStats.reduce((sum, bucket) => sum + bucket.imageCount, 0),
    buckets: bucketStats,
  };
}

export async function festivalEditionStatusStats() {
  const { data, error } = await supabaseAdmin
    .from("festival_editions")
    .select("festival_id, status")
    .in("status", ["upcoming", "past"]);

  if (error) throw new Error(`festival edition status: ${error.message}`);

  const upcoming = new Set();
  const past = new Set();

  for (const row of data || []) {
    if (row.status === "upcoming" && row.festival_id) {
      upcoming.add(row.festival_id);
    }
    if (row.status === "past" && row.festival_id) {
      past.add(row.festival_id);
    }
  }

  return { upcoming: upcoming.size, past: past.size };
}

export async function eventDateStatusStats() {
  const today = new Date().toISOString().slice(0, 10);

  const [upcomingResult, pastResult] = await Promise.all([
    supabaseAdmin
      .from("events")
      .select("*", { count: "exact", head: true })
      .gte("date", today),
    supabaseAdmin
      .from("events")
      .select("*", { count: "exact", head: true })
      .lt("date", today),
  ]);

  if (upcomingResult.error) {
    throw new Error(`events upcoming: ${upcomingResult.error.message}`);
  }
  if (pastResult.error) {
    throw new Error(`events past: ${pastResult.error.message}`);
  }

  return {
    upcoming: upcomingResult.count ?? 0,
    past: pastResult.count ?? 0,
  };
}

export const TABLE_STORAGE_GROUPS = [
  { key: "events", label: "Events", tables: ["events"] },
  {
    key: "festivals",
    label: "Festivals",
    tables: ["festivals", "festival_lineup", "festival_tickets"],
  },
  { key: "artists", label: "Artists", tables: ["artists"] },
  {
    key: "artist_schedule",
    label: "Artist Schedule",
    tables: ["artist_schedule"],
  },
  { key: "clubs", label: "Clubs", tables: ["clubs", "club_dates"] },
  { key: "artist_albums", label: "Artist Albums", tables: ["artist_albums"] },
];

export async function tableStorageStats({ allowFallback = true } = {}) {
  const tableNames = [...new Set(TABLE_STORAGE_GROUPS.flatMap((g) => g.tables))];
  const { data, error } = await supabaseAdmin.rpc(
    "get_admin_table_storage_sizes",
    { table_names: tableNames },
  );

  if (error) {
    if (!allowFallback) {
      throw new Error(error.message);
    }
    return tableStorageFallbackStats(error.message);
  }

  const byTable = new Map((data || []).map((row) => [row.table_name, row]));
  const groups = TABLE_STORAGE_GROUPS.map((group) => {
    const tables = group.tables.map((table) => ({
      tableName: table,
      totalBytes: Number(byTable.get(table)?.total_bytes || 0),
      tableBytes: Number(byTable.get(table)?.table_bytes || 0),
      indexBytes: Number(byTable.get(table)?.index_bytes || 0),
      rowEstimate: Number(byTable.get(table)?.row_estimate || 0),
    }));

    return {
      key: group.key,
      label: group.label,
      tables,
      totalBytes: tables.reduce((sum, table) => sum + table.totalBytes, 0),
      tableBytes: tables.reduce((sum, table) => sum + table.tableBytes, 0),
      indexBytes: tables.reduce((sum, table) => sum + table.indexBytes, 0),
      rowEstimate: tables.reduce((sum, table) => sum + table.rowEstimate, 0),
    };
  });

  return {
    isExact: true,
    totalBytes: groups.reduce((sum, group) => sum + group.totalBytes, 0),
    groups,
  };
}

async function tableStorageFallbackStats(rpcErrorMessage) {
  const groups = await Promise.all(
    TABLE_STORAGE_GROUPS.map(async (group) => {
      const tables = await Promise.all(
        group.tables.map(async (table) => ({
          tableName: table,
          totalBytes: null,
          tableBytes: null,
          indexBytes: null,
          rowEstimate: await countWhere(table).catch(() => 0),
        })),
      );

      return {
        key: group.key,
        label: group.label,
        tables,
        totalBytes: null,
        tableBytes: null,
        indexBytes: null,
        rowEstimate: tables.reduce((sum, table) => sum + table.rowEstimate, 0),
      };
    }),
  );

  return {
    isExact: false,
    totalBytes: null,
    message:
      "Exact table sizes need the audit table-size migration and Supabase schema cache refresh.",
    rpcError: rpcErrorMessage,
    groups,
  };
}
