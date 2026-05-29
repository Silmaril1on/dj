import { NextResponse } from "next/server";
import { getGlobeEvents } from "@/app/lib/services/events/globeEvents";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const events = await getGlobeEvents();
    return NextResponse.json({ success: true, events });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: err.status || 500 },
    );
  }
}
