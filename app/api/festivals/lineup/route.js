import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getLineup,
  createLineup,
  updateLineup,
  updateLineupArtist,
  deleteLineupArtist,
  deleteFullLineup,
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
    // Individual artist update
    if (body.action === "update_artist") {
      const result = await updateLineupArtist(body, cookieStore);
      return NextResponse.json(result);
    }
    // Full lineup update
    const result = await updateLineup(body, cookieStore);
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const lineup_id = searchParams.get("lineup_id");
    const festival_id = searchParams.get("festival_id");
    const cookieStore = await cookies();

    // No lineup_id = delete the entire festival lineup
    if (!lineup_id && festival_id) {
      const result = await deleteFullLineup({ festival_id }, cookieStore);
      return NextResponse.json(result);
    }

    const result = await deleteLineupArtist(
      { lineup_id, festival_id },
      cookieStore,
    );
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}
