import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getAllClubs,
  createClub,
  updateClub,
  deleteClub,
} from "@/app/lib/services/clubs/clubs";
import { ServiceError } from "@/app/lib/services/shared";
import { getServerUser } from "@/app/lib/config/supabaseServer";

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
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const cookieStore = await cookies();
    const { user } = await getServerUser(cookieStore);
    const result = await getAllClubs({
      limit,
      offset,
      userId: user?.id ?? null,
    });
    return NextResponse.json({ data: result.clubs || [] });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const formData = await request.formData();
    const result = await createClub(formData, cookieStore);
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request) {
  try {
    const cookieStore = await cookies();
    const formData = await request.formData();
    const result = await updateClub(formData, cookieStore);
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request) {
  try {
    const cookieStore = await cookies();
    const formData = await request.formData();
    const result = await updateClub(formData, cookieStore);
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const clubId = searchParams.get("clubId");
    const cookieStore = await cookies();
    const result = await deleteClub(clubId, cookieStore);
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}
