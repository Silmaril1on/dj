import { NextResponse } from "next/server";
import { getUserRates } from "@/app/lib/services/user/get-stats/getUserRates";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;

    const data = await getUserRates({ page, limit });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const status = error.message === "User not authenticated" ? 401 : 500;
    return NextResponse.json(
      { success: false, error: error.message },
      { status },
    );
  }
}
