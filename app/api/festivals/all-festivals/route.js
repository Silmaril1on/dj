import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/lib/config/supabaseServer";
import { cookies } from "next/headers";

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const qp = url.searchParams;

    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);

    const limit = parseInt(qp.get("limit") || "20", 10);
    const offset = parseInt(qp.get("offset") || "0", 10);

    // Filters
    const country = qp.get("country") || null;
    const name = qp.get("name") || null;
    const sort = qp.get("sort") || null;

    // Build base query
    let query = supabase
      .from("festivals")
      .select(
        `id, name, poster, country, city, location, start_date, end_date, description, created_at`,
        { count: "exact" }
      )
      .eq("status", "approved");

    // TEXT search on name (case-insensitive)
    if (name) {
      query = query.ilike("name", `%${escapeLike(name)}%`);
    }

    if (country) {
      query = query.eq("country", country);
    }

    // Sorting
    if (sort === "name") {
      query = query.order("name", { ascending: true });
    } else if (sort === "newest") {
      query = query.order("created_at", { ascending: false });
    } else if (sort === "oldest") {
      query = query.order("created_at", { ascending: true });
    } else if (sort === "date_asc") {
      query = query.order("start_date", { ascending: true, nulls: "last" });
    } else if (sort === "date_desc") {
      query = query.order("start_date", { ascending: false, nulls: "last" });
    } else {
      // Default sort by name
      query = query.order("name", { ascending: true });
    }

    // Apply pagination range
    const from = offset;
    const to = offset + limit - 1;
    query = query.range(from, to);

    const { data: festivalsPage, count, error: festivalsError } = await query;

    if (festivalsError) {
      console.error("Error fetching festivals (filtered):", festivalsError);
      return NextResponse.json({ error: festivalsError.message }, { status: 500 });
    }

    const returned = festivalsPage || [];

    // Fetch likes count for festivals on this page
    const festivalIds = returned.map((f) => f.id);
    let likesCount = {};
    if (festivalIds.length > 0) {
      const { data: likesData, error: likesError } = await supabase
        .from("festival_likes")
        .select("festival_id")
        .in("festival_id", festivalIds);

      if (likesError) {
        console.error("Error fetching likes:", likesError);
      } else {
        likesData.forEach((l) => {
          likesCount[l.festival_id] = (likesCount[l.festival_id] || 0) + 1;
        });
      }
    }

    const festivalsWithLikes = returned.map((festival) => ({
      ...festival,
      likesCount: likesCount[festival.id] || 0,
    }));

    // If sorting by most_liked, apply client-side sort
    let finalList = festivalsWithLikes;
    if (sort === "most_liked") {
      finalList = finalList.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
    }

    const total = typeof count === "number" ? count : null;

    return NextResponse.json({
      data: finalList,
      total,
      limit,
      offset,
      hasMore: total !== null ? offset + finalList.length < total : finalList.length === limit,
    });
  } catch (error) {
    console.error("Error in GET all-festivals API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ---------- helpers ---------- */

function escapeLike(input) {
  // escape percent/underscore for ilike safety
  return input.replace(/[%_]/g, (m) => `\\${m}`);
}
