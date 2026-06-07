import { NextResponse } from "next/server";
import {
  cacheAuditData,
  countWhere,
  eventDateStatusStats,
  festivalEditionStatusStats,
  imageStats,
  requireAuditAdmin,
} from "../_lib/audit";

async function contentStats(table, { imageTable = table } = {}) {
  const [total, approved, pending, images] = await Promise.all([
    countWhere(table),
    countWhere(table, { status: "approved" }),
    countWhere(table, { status: "pending" }),
    imageStats(imageTable),
  ]);

  return { total, approved, pending, images };
}

const getCachedMiddleStats = cacheAuditData("middle", async () => {
  const [
    artists,
    clubs,
    festivalsBase,
    eventsBase,
    festivalStatuses,
    eventStatuses,
  ] = await Promise.all([
    contentStats("artists"),
    contentStats("clubs"),
    contentStats("festivals"),
    contentStats("events"),
    festivalEditionStatusStats(),
    eventDateStatusStats(),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    artists,
    clubs,
    festivals: { ...festivalsBase, ...festivalStatuses },
    events: { ...eventsBase, ...eventStatuses },
  };
});

export async function GET() {
  try {
    const auth = await requireAuditAdmin();
    if (auth.error) return auth.error;

    return NextResponse.json(await getCachedMiddleStats());
  } catch (error) {
    console.error("[admin/audit/middle]", error);
    return NextResponse.json(
      { error: "Failed to fetch audit content stats", details: error.message },
      { status: 500 },
    );
  }
}
