import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getStages } from "@/app/lib/services/festivals/festivalLineup";
import { ServiceError } from "@/app/lib/services/shared";

export async function GET(request) {
  try {
    const festivalId = new URL(request.url).searchParams.get("festival_id");
    const cookieStore = await cookies();
    const result = await getStages(festivalId, cookieStore);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
