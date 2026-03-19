import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getClubDates,
  createClubDate,
  deleteClubDate,
  updateClubDate,
} from "@/app/lib/services/clubs/clubDates";
import { ServiceError } from "@/app/lib/services/submit-data-types/shared";

const handleError = (error) => {
  if (error instanceof ServiceError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status },
    );
  }
  return NextResponse.json(
    { success: false, error: "Internal server error" },
    { status: 500 },
  );
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const clubId = searchParams.get("clubId");
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const cookieStore = await cookies();
    const result = await getClubDates(clubId, { limit, offset }, cookieStore);
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request) {
  try {
    const clubId = new URL(request.url).searchParams.get("clubId");
    const cookieStore = await cookies();
    const formData = await request.formData();
    const result = await createClubDate(clubId, formData, cookieStore);
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request) {
  try {
    const dateId = new URL(request.url).searchParams.get("id");
    if (!dateId) {
      return NextResponse.json(
        { success: false, error: "Date ID is required" },
        { status: 400 },
      );
    }
    const cookieStore = await cookies();
    const data = await request.json();
    const result = await updateClubDate(dateId, data, cookieStore);
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request) {
  try {
    const dateId = new URL(request.url).searchParams.get("id");
    if (!dateId) {
      return NextResponse.json(
        { success: false, error: "Date ID is required" },
        { status: 400 },
      );
    }
    const cookieStore = await cookies();
    const result = await deleteClubDate(dateId, cookieStore);
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}
