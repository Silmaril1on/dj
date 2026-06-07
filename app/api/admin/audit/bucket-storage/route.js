import { NextResponse } from "next/server";
import {
  bucketStorageStats,
  cacheAuditData,
  requireAuditAdmin,
} from "../_lib/audit";

const getCachedBucketStorage = cacheAuditData("bucket-storage", async () => ({
  generatedAt: new Date().toISOString(),
  storage: await bucketStorageStats(),
}));

export async function GET() {
  try {
    const auth = await requireAuditAdmin();
    if (auth.error) return auth.error;

    return NextResponse.json(await getCachedBucketStorage());
  } catch (error) {
    console.error("[admin/audit/bucket-storage]", error);
    return NextResponse.json(
      { error: "Failed to fetch bucket storage stats", details: error.message },
      { status: 500 },
    );
  }
}
