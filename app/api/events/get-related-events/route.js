import { NextResponse } from "next/server";
import { getRelatedEvents } from "@/app/lib/services/events/getRelatedEvents";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const country = searchParams.get("country");

    if (!eventId || !country) {
      return NextResponse.json({ events: [] });
    }

    const events = await getRelatedEvents(eventId, country);
    return NextResponse.json({ events });
  } catch (err) {
    console.error("Related events error:", err);
    return NextResponse.json({ events: [] });
  }
}
