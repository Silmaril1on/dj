import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getLineup,
  createLineup,
  updateLineup,
} from "@/app/lib/services/festivals/festivalLineup";
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
    const result = await getLineup(festivalId, cookieStore);
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const body = await request.json();
    const result = await createLineup(body, cookieStore);
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request) {
  try {
    const cookieStore = await cookies();
    const body = await request.json();
    const result = await updateLineup(body, cookieStore);
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}
