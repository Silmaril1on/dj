import { NextResponse } from "next/server";
import { getNearYouEvents } from "@/app/lib/services/events/event";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get("country");
    const city = searchParams.get("city")?.trim() || null;
    const data = await getNearYouEvents(country, city);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
