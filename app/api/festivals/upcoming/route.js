import { getSupabaseAdminClient } from "@/app/lib/services/shared";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const admin = getSupabaseAdminClient();
    const today = new Date().toISOString().slice(0, 10);

    // Fetch 8 upcoming approved festival editions
    const { data: editions, error } = await admin
      .from("festival_editions")
      .select(
        `
          id,
          festival_id,
          start_date,
          end_date,
          status,
          festivals!inner(
            id,
            name,
            capacity_total,
            country,
            city,
            address,
            festival_slug,
            festival_genre,
            festival_poster,
            status
          )
        `,
      )
      .eq("status", "upcoming")
      .eq("festivals.status", "approved")
      .gte("start_date", today)
      .order("start_date", { ascending: true })
      .limit(8);

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch festivals" },
        { status: 500 },
      );
    }

    if (!editions || editions.length === 0) {
      return NextResponse.json({ festivals: [] });
    }

    // Fetch up to 10 artist names per edition
    const editionIds = editions.map((e) => e.id);
    const { data: lineupRows } = await admin
      .from("festival_lineup")
      .select("edition_id, artist_name, artist_order")
      .in("edition_id", editionIds)
      .order("artist_order", { ascending: true });

    const lineupByEdition = {};
    (lineupRows || []).forEach((row) => {
      if (!lineupByEdition[row.edition_id])
        lineupByEdition[row.edition_id] = [];
      if (lineupByEdition[row.edition_id].length < 10) {
        lineupByEdition[row.edition_id].push(row.artist_name);
      }
    });

    const result = editions.map((edition) => {
      const festival = edition.festivals;
      return {
        ...festival,
        start_date: edition.start_date,
        end_date: edition.end_date,
        edition_id: edition.id,
        edition_status: edition.status,
        artists: lineupByEdition[edition.id] || [],
      };
    });

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
