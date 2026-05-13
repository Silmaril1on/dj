/**
 * CACHING DEMO — API Route
 * Supports GET (read) and POST (write/mutate) for the cache_table.
 * The GET endpoint has 4 modes controlled by ?strategy= query param:
 *   - no-store      → fetch with cache:"no-store", always fresh from DB
 *   - force-dynamic → same as no-store but demonstrates the segment config pattern
 *   - revalidate    → fetch with next:{revalidate:60}, stale-while-revalidate (60s)
 *   - unstable      → uses unstable_cache wrapper, per-key memoised (60s TTL)
 */

import { NextResponse } from "next/server";
import { unstable_cache, revalidateTag } from "next/cache";
import { createClient } from "@supabase/supabase-js";

// Use admin client so we don't need RLS for the demo table
const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

// ─── unstable_cache wrapper — data is memoised in the Next.js server cache ───
const getCachedRows = unstable_cache(
  async () => {
    console.log(
      "[cache-demo] unstable_cache MISS — hitting Supabase for rows...",
    );
    const admin = getAdmin();
    const { data, error } = await admin
      .from("cache_table")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  },
  ["cache-demo-rows"], // cache key
  {
    revalidate: 60, // 60-second TTL
    tags: ["cache-demo"], // revalidateTag("cache-demo") clears this
  },
);

// ─── Raw fetch — no caching layer ─────────────────────────────────────────────
async function getFreshRows() {
  console.log("[cache-demo] NO-STORE — hitting Supabase directly...");
  const admin = getAdmin();
  const { data, error } = await admin
    .from("cache_table")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function GET(request) {
  const strategy =
    new URL(request.url).searchParams.get("strategy") || "no-store";
  const start = Date.now();

  try {
    let rows;
    let cacheNote;

    if (strategy === "unstable") {
      rows = await getCachedRows();
      cacheNote =
        "unstable_cache: data is served from Next.js server memory cache (60s TTL). " +
        "First call hits DB and logs a MISS; subsequent calls within 60s are instant.";
    } else if (strategy === "revalidate") {
      // Demonstrate next:{revalidate} via fetch (works in server components / route handlers)
      // In a route handler we simulate this by calling our own endpoint with revalidate headers
      // but the canonical place is in server components calling fetch(). Here we do a fresh
      // DB call and attach Cache-Control so the *client* caches for 60s (SWR pattern).
      rows = await getFreshRows();
      cacheNote =
        "revalidate strategy: In server components, wrap fetch() with next:{revalidate:60}. " +
        "The response is cached by Next.js and regenerated in the background after 60s. " +
        "This endpoint sets Cache-Control:s-maxage=60,stale-while-revalidate=60 so a CDN " +
        "or client browser also caches it for 60s.";
    } else {
      // no-store / force-dynamic — always fresh
      rows = await getFreshRows();
      cacheNote =
        "no-store / force-dynamic: Every single request hits the database. " +
        "Use for user-specific data or anything that must always be fresh.";
    }

    const elapsed = Date.now() - start;
    console.log(
      `[cache-demo][${strategy}] responded in ${elapsed}ms with ${rows.length} rows`,
    );

    const response = NextResponse.json({
      strategy,
      rows,
      count: rows.length,
      fetchedAt: new Date().toISOString(),
      elapsed,
      cacheNote,
    });

    if (strategy === "revalidate") {
      // SWR headers — CDN / browser caches for 60s, then serves stale while revalidating
      response.headers.set(
        "Cache-Control",
        "public, s-maxage=60, stale-while-revalidate=60",
      );
    } else {
      response.headers.set("Cache-Control", "no-store");
    }

    return response;
  } catch (err) {
    console.error("[cache-demo] GET error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { action, name, age, id } = await request.json();
    const admin = getAdmin();

    if (action === "add") {
      const { data, error } = await admin
        .from("cache_table")
        .insert([{ name: name || "New Entry", age: age ?? 0 }])
        .select()
        .single();
      if (error) throw new Error(error.message);

      // Bust the unstable_cache tag so next fetch is fresh
      revalidateTag("cache-demo");
      console.log(
        "[cache-demo] INSERT done — revalidateTag('cache-demo') called",
      );

      return NextResponse.json({ success: true, row: data });
    }

    if (action === "delete") {
      if (!id)
        return NextResponse.json({ error: "id required" }, { status: 400 });
      const { error } = await admin.from("cache_table").delete().eq("id", id);
      if (error) throw new Error(error.message);

      revalidateTag("cache-demo");
      console.log(
        "[cache-demo] DELETE done — revalidateTag('cache-demo') called",
      );

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[cache-demo] POST error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
