import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getEventTickets,
  upsertEventTickets,
} from "@/app/lib/services/events/eventTickets";
import { ServiceError } from "@/app/lib/services/shared";

const handleError = (error) => {
  if (error instanceof ServiceError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
};

export async function GET(request) {
  try {
    const eventId = new URL(request.url).searchParams.get("event_id");
    const cookieStore = await cookies();
    const result = await getEventTickets(eventId, cookieStore);
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const body = await request.json();
    const result = await upsertEventTickets(body, cookieStore);
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}
