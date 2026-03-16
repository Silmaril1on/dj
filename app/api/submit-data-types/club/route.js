import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getClubById,
  createClub,
  updateClub,
} from "@/app/lib/services/submit-data-types/clubService";
import { ServiceError } from "@/app/lib/services/submit-data-types/shared";

const handleError = (error) => {
  if (error instanceof ServiceError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
};

export async function GET(request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    const cookieStore = await cookies();
    const club = await getClubById(id, cookieStore);
    return NextResponse.json(club);
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
