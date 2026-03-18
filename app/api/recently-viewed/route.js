import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { addRecentView } from "@/app/lib/services/recent-views/addRecentView";
import { getRecentViews } from "@/app/lib/services/recent-views/getRecentViews";

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const { type, item_id } = await request.json();
    const result = await addRecentView(cookieStore, { type, item_id });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const status = error.message === "Authentication required" ? 401 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const data = await getRecentViews(cookieStore, { type });
    return NextResponse.json({ data });
  } catch (error) {
    const status = error.message === "Authentication required" ? 401 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
