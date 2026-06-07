import { NextResponse } from "next/server";
import {
  cacheAuditData,
  requireAuditAdmin,
  tableStorageStats,
} from "../_lib/audit";

const getCachedTableStorage = cacheAuditData("table-storage", async () => ({
  generatedAt: new Date().toISOString(),
  storage: await tableStorageStats({ allowFallback: false }),
}));

export async function GET() {
  try {
    const auth = await requireAuditAdmin();
    if (auth.error) return auth.error;

    try {
      return NextResponse.json(await getCachedTableStorage());
    } catch {
      return NextResponse.json({
        generatedAt: new Date().toISOString(),
        storage: await tableStorageStats({ allowFallback: true }),
      });
    }
  } catch (error) {
    console.error("[admin/audit/table-storage]", error);
    return NextResponse.json(
      { error: "Failed to fetch table storage stats", details: error.message },
      { status: 500 },
    );
  }
}
