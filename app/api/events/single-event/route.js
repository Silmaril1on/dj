import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getEventById } from "@/app/lib/services/events/event";

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const data = await getEventById(cookieStore, id);
    return NextResponse.json(data);
  } catch (err) {
    const status = err.status || 500;
    return NextResponse.json(
      { success: false, error: err.message },
      { status },
    );
  }
}
