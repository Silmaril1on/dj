import { NextResponse } from "next/server";
import {
  bucketStorageStats,
  cacheAuditData,
  countSince,
  countWhere,
  eventDateStatusStats,
  festivalEditionStatusStats,
  imageStats,
  periodStart,
  requireAuditAdmin,
  tableStorageStats,
} from "./_lib/audit";

const getCachedAudit = cacheAuditData("aggregate", async () => {
  const today = periodStart(0);
  const lastWeek = periodStart(7);
  const lastMonth = periodStart(30);

  const [
    usersTotal,
    usersToday,
    usersLastWeek,
    usersLastMonth,
    artistsTotal,
    artistsApproved,
    artistsPending,
    clubsTotal,
    clubsApproved,
    clubsPending,
    festivalsTotal,
    festivalsApproved,
    festivalsPending,
    festivalStatuses,
    eventsTotal,
    eventsApproved,
    eventsPending,
    eventStatuses,
    newsTotal,
    artistImgStats,
    clubImgStats,
    festivalImgStats,
    eventImgStats,
    storage,
    tableStorage,
  ] = await Promise.all([
    countWhere("users"),
    countSince("users", "created_at", today),
    countSince("users", "created_at", lastWeek),
    countSince("users", "created_at", lastMonth),
    countWhere("artists"),
    countWhere("artists", { status: "approved" }),
    countWhere("artists", { status: "pending" }),
    countWhere("clubs"),
    countWhere("clubs", { status: "approved" }),
    countWhere("clubs", { status: "pending" }),
    countWhere("festivals"),
    countWhere("festivals", { status: "approved" }),
    countWhere("festivals", { status: "pending" }),
    festivalEditionStatusStats(),
    countWhere("events"),
    countWhere("events", { status: "approved" }),
    countWhere("events", { status: "pending" }),
    eventDateStatusStats(),
    countWhere("news"),
    imageStats("artists"),
    imageStats("clubs"),
    imageStats("festivals"),
    imageStats("events"),
    bucketStorageStats(),
    tableStorageStats(),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    users: {
      total: usersTotal,
      today: usersToday,
      lastWeek: usersLastWeek,
      lastMonth: usersLastMonth,
    },
    artists: {
      total: artistsTotal,
      approved: artistsApproved,
      pending: artistsPending,
      images: artistImgStats,
    },
    clubs: {
      total: clubsTotal,
      approved: clubsApproved,
      pending: clubsPending,
      images: clubImgStats,
    },
    festivals: {
      total: festivalsTotal,
      approved: festivalsApproved,
      pending: festivalsPending,
      ...festivalStatuses,
      images: festivalImgStats,
    },
    events: {
      total: eventsTotal,
      approved: eventsApproved,
      pending: eventsPending,
      ...eventStatuses,
      images: eventImgStats,
    },
    news: { total: newsTotal },
    storage,
    tableStorage,
  };
});

export async function GET() {
  try {
    const auth = await requireAuditAdmin();
    if (auth.error) return auth.error;

    return NextResponse.json(await getCachedAudit());
  } catch (error) {
    console.error("[admin/audit]", error);
    return NextResponse.json(
      { error: "Failed to fetch audit data", details: error.message },
      { status: 500 },
    );
  }
}
