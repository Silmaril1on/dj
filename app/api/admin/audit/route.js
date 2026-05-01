/**
 * GET /api/admin/audit
 * Returns comprehensive platform stats for the admin audit page.
 * Admin only.
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerUser, supabaseAdmin } from "@/app/lib/config/supabaseServer";

function periodStart(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

async function countWhere(table, filters = {}) {
  let q = supabaseAdmin.from(table).select("*", { count: "exact", head: true });
  for (const [col, val] of Object.entries(filters)) {
    if (val !== undefined) q = q.eq(col, val);
  }
  const { count, error } = await q;
  if (error) throw new Error(`${table} count: ${error.message}`);
  return count ?? 0;
}

async function countSince(table, col, iso, extraFilters = {}) {
  let q = supabaseAdmin
    .from(table)
    .select("*", { count: "exact", head: true })
    .gte(col, iso);
  for (const [k, v] of Object.entries(extraFilters)) q = q.eq(k, v);
  const { count, error } = await q;
  if (error) throw new Error(`${table} since ${iso}: ${error.message}`);
  return count ?? 0;
}

// Estimate storage by counting image_url JSONB variants (each variant ≈ a file)
async function imageStats(table) {
  const PAGE = 1000;
  let from = 0;
  let missing = 0,
    legacy = 0,
    single = 0,
    optimized = 0,
    total = 0;

  while (true) {
    const { data, error } = await supabaseAdmin
      .from(table)
      .select("image_url")
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`${table} image stats: ${error.message}`);
    if (!data || data.length === 0) break;

    for (const row of data) {
      total++;
      const img = row.image_url;
      if (!img) { missing++; continue; }
      if (typeof img === "string") { legacy++; continue; }
      const { sm, md, lg } = img;
      if (!sm && !md && !lg) { missing++; continue; }
      if (sm === md && md === lg) { single++; continue; }
      optimized++;
    }

    if (data.length < PAGE) break;
    from += PAGE;
  }

  return { total, missing, legacy, single, optimized };
}

// Top genres across artists
async function topGenres(limit = 8) {
  const { data, error } = await supabaseAdmin
    .from("artists")
    .select("genres")
    .not("genres", "is", null);
  if (error) return [];
  const freq = {};
  for (const row of data || []) {
    for (const g of row.genres || []) {
      if (g) freq[g] = (freq[g] || 0) + 1;
    }
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([genre, count]) => ({ genre, count }));
}

// Top countries across a table (by `country` column)
async function topCountries(table, limit = 5) {
  const { data, error } = await supabaseAdmin
    .from(table)
    .select("country")
    .not("country", "is", null);
  if (error) return [];
  const freq = {};
  for (const row of data || []) {
    if (row.country) freq[row.country] = (freq[row.country] || 0) + 1;
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([country, count]) => ({ country, count }));
}

// Daily new users for the last N days (for a sparkline)
async function dailySignups(days = 14) {
  const since = periodStart(days);
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("created_at")
    .gte("created_at", since);
  if (error) return [];
  const buckets = {};
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    buckets[d.toISOString().slice(0, 10)] = 0;
  }
  for (const row of data || []) {
    const day = row.created_at.slice(0, 10);
    if (day in buckets) buckets[day]++;
  }
  return Object.entries(buckets).map(([date, count]) => ({ date, count }));
}

// Bookings stats
async function bookingStats() {
  const total = await countWhere("booking_requests");
  const pending = await countWhere("booking_requests", { status: "pending" });
  const approved = await countWhere("booking_requests", { status: "approved" });
  const declined = await countWhere("booking_requests", { status: "declined" });
  return { total, pending, approved, declined };
}

// Reviews count
async function reviewStats() {
  const total = await countWhere("reviews").catch(() => 0);
  const lastWeek = await countSince("reviews", "created_at", periodStart(7)).catch(() => 0);
  return { total, lastWeek };
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const { user, error: authError } = await getServerUser(cookieStore);

    if (authError || !user || !user.is_admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const now = new Date().toISOString();
    const w7 = periodStart(7);
    const w30 = periodStart(30);
    const today = periodStart(1);

    // ── Parallel fetches ─────────────────────────────────────────────────────
    const [
      usersTotal,
      usersLastWeek,
      usersLastMonth,
      usersToday,

      artistsTotal,
      artistsApproved,
      artistsPending,

      clubsTotal,
      clubsApproved,
      clubsPending,

      festivalsTotal,
      festivalsApproved,
      festivalsPending,

      eventsTotal,
      eventsApproved,
      eventsPending,
      eventsUpcoming,
      eventsPast,

      newsTotal,

      artistImgStats,
      clubImgStats,
      festivalImgStats,
      eventImgStats,

      topGenresList,
      artistCountries,
      clubCountries,

      signupSeries,
      bookings,
      reviews,
    ] = await Promise.all([
      countWhere("users"),
      countSince("users", "created_at", w7),
      countSince("users", "created_at", w30),
      countSince("users", "created_at", today),

      countWhere("artists"),
      countWhere("artists", { status: "approved" }),
      countWhere("artists", { status: "pending" }),

      countWhere("clubs"),
      countWhere("clubs", { status: "approved" }),
      countWhere("clubs", { status: "pending" }),

      countWhere("festivals"),
      countWhere("festivals", { status: "approved" }),
      countWhere("festivals", { status: "pending" }),

      countWhere("events"),
      countWhere("events", { status: "approved" }),
      countWhere("events", { status: "pending" }),
      // Upcoming = date >= today
      supabaseAdmin
        .from("events")
        .select("*", { count: "exact", head: true })
        .gte("date", new Date().toISOString().slice(0, 10))
        .then(({ count }) => count ?? 0),
      // Past = date < today
      supabaseAdmin
        .from("events")
        .select("*", { count: "exact", head: true })
        .lt("date", new Date().toISOString().slice(0, 10))
        .then(({ count }) => count ?? 0),

      countWhere("news"),

      imageStats("artists"),
      imageStats("clubs"),
      imageStats("festivals"),
      imageStats("events"),

      topGenres(),
      topCountries("artists"),
      topCountries("clubs"),

      dailySignups(14),
      bookingStats(),
      reviewStats(),
    ]);

    return NextResponse.json({
      generatedAt: now,
      users: {
        total: usersTotal,
        today: usersToday,
        lastWeek: usersLastWeek,
        lastMonth: usersLastMonth,
        signupSeries,
      },
      artists: {
        total: artistsTotal,
        approved: artistsApproved,
        pending: artistsPending,
        images: artistImgStats,
        topCountries: artistCountries,
        topGenres: topGenresList,
      },
      clubs: {
        total: clubsTotal,
        approved: clubsApproved,
        pending: clubsPending,
        images: clubImgStats,
        topCountries: clubCountries,
      },
      festivals: {
        total: festivalsTotal,
        approved: festivalsApproved,
        pending: festivalsPending,
        images: festivalImgStats,
      },
      events: {
        total: eventsTotal,
        approved: eventsApproved,
        pending: eventsPending,
        upcoming: eventsUpcoming,
        past: eventsPast,
        images: eventImgStats,
      },
      news: { total: newsTotal },
      bookings,
      reviews,
    });
  } catch (error) {
    console.error("❌ Audit route error:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit data", details: error.message },
      { status: 500 },
    );
  }
}
