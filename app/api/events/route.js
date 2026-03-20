import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getLimitedEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from "@/app/lib/services/events/event";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "15", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const data = await getLimitedEvents({ limit, offset });
    return NextResponse.json({ success: true, data });
  } catch (err) {
    const status = err.status || 500;
    return NextResponse.json(
      { success: false, error: err.message },
      { status },
    );
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const formData = await request.formData();
    const result = await createEvent(formData, cookieStore);
    return NextResponse.json(result);
  } catch (err) {
    const status = err.status || 500;
    return NextResponse.json(
      { success: false, error: err.message },
      { status },
    );
  }
}

export async function PATCH(request) {
  try {
    const cookieStore = await cookies();
    const formData = await request.formData();
    const result = await updateEvent(formData, cookieStore);
    return NextResponse.json(result);
  } catch (err) {
    const status = err.status || 500;
    return NextResponse.json(
      { success: false, error: err.message },
      { status },
    );
  }
}

export async function DELETE(request) {
  try {
    const cookieStore = await cookies();
    const { eventId } = await request.json();
    const result = await deleteEvent(eventId, cookieStore);
    return NextResponse.json(result);
  } catch (err) {
    const status = err.status || 500;
    return NextResponse.json(
      { success: false, error: err.message },
      { status },
    );
  }
}
