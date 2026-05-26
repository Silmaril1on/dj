import { getSupabaseAdminClient } from "@/app/lib/services/shared";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const admin = getSupabaseAdminClient();
    const today = new Date().toISOString().slice(0, 10);

    // Fetch 8 upcoming approved festivals
    const { data: festivals, error } = await admin
      .from("festivals")
      .select(
        "id, name, start_date, end_date, capacity_total, country, city, address, festival_slug,  festival_genre, festival_poster",
      )
      .eq("status", "approved")
      .gte("start_date", today)
      .order("start_date", { ascending: true })
      .limit(8);

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch festivals" },
        { status: 500 },
      );
    }

    if (!festivals || festivals.length === 0) {
      return NextResponse.json({ festivals: [] });
    }

    // Fetch up to 10 artist names per festival
    const festivalIds = festivals.map((f) => f.id);
    const { data: lineupRows } = await admin
      .from("festival_lineup")
      .select("festival_id, artist_name")
      .in("festival_id", festivalIds)
      .order("artist_order", { ascending: true });

    const lineupByFestival = {};
    (lineupRows || []).forEach((row) => {
      if (!lineupByFestival[row.festival_id])
        lineupByFestival[row.festival_id] = [];
      if (lineupByFestival[row.festival_id].length < 10) {
        lineupByFestival[row.festival_id].push(row.artist_name);
      }
    });

    const result = festivals.map((f) => ({
      ...f,
      artists: lineupByFestival[f.id] || [],
    }));

    return NextResponse.json(
      { festivals: result },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
