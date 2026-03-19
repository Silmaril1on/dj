import { NextResponse } from "next/server";
import { getUserStatistics } from "@/app/lib/services/user/get-stats/getUserStatistics";

export async function GET() {
  try {
    const data = await getUserStatistics();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const status = error.message === "User not authenticated" ? 401 : 500;
    return NextResponse.json(
      { success: false, error: error.message },
      { status },
    );
  }
}
