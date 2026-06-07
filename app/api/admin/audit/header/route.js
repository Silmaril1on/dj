import { NextResponse } from "next/server";
import {
  cacheAuditData,
  countSince,
  countWhere,
  periodStart,
  requireAuditAdmin,
} from "../_lib/audit";

const getCachedHeaderStats = cacheAuditData("header", async () => {
  const today = periodStart(0);
  const lastWeek = periodStart(7);
  const lastMonth = periodStart(30);

  const [
    usersTotal,
    usersToday,
    usersLastWeek,
    usersLastMonth,
    artistsTotal,
    clubsTotal,
    festivalsTotal,
    eventsTotal,
    newsTotal,
  ] = await Promise.all([
    countWhere("users"),
    countSince("users", "created_at", today),
    countSince("users", "created_at", lastWeek),
    countSince("users", "created_at", lastMonth),
    countWhere("artists"),
    countWhere("clubs"),
    countWhere("festivals"),
    countWhere("events"),
    countWhere("news"),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      artists: artistsTotal,
      clubs: clubsTotal,
      festivals: festivalsTotal,
      events: eventsTotal,
      news: newsTotal,
    },
    users: {
      total: usersTotal,
      today: usersToday,
      lastWeek: usersLastWeek,
      lastMonth: usersLastMonth,
    },
  };
});

export async function GET() {
  try {
    const auth = await requireAuditAdmin();
    if (auth.error) return auth.error;

    return NextResponse.json(await getCachedHeaderStats());
  } catch (error) {
    console.error("[admin/audit/header]", error);
    return NextResponse.json(
      { error: "Failed to fetch audit header stats", details: error.message },
      { status: 500 },
    );
  }
}
