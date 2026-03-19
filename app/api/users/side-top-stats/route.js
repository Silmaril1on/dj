import { NextResponse } from "next/server";
import { getSideTopStats } from "@/app/lib/services/user/get-stats/getSideTopStats";

export async function GET() {
  try {
    const data = await getSideTopStats();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        data: { thisWeek: [], previousWeek: [] },
      },
      { status: 500 },
    );
  }
}
