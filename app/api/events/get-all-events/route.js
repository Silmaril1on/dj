import { NextResponse } from "next/server";
import { getLimitedEvents } from "@/app/lib/services/events/event";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "15", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const data = await getLimitedEvents({ limit, offset });
    return NextResponse.json({ data });
  } catch (err) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
