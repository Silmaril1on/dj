import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getFestivalTickets,
  upsertFestivalTickets,
} from "@/app/lib/services/festivals/festivalTickets";
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
    const festivalId = new URL(request.url).searchParams.get("festival_id");
    const cookieStore = await cookies();
    const result = await getFestivalTickets(festivalId, cookieStore);
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const body = await request.json();
    const result = await upsertFestivalTickets(body, cookieStore);
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}
