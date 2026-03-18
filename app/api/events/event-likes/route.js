import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getEventLikes,
  toggleEventLike,
} from "@/app/lib/services/events/eventLikes";

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const result = await getEventLikes(cookieStore, eventId);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const { eventId } = await request.json();
    const result = await toggleEventLike(cookieStore, eventId);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    const status = err.status || 500;
    return NextResponse.json(
      { success: false, error: err.message },
      { status },
    );
  }
}
