import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getArtistById,
  createArtist,
  updateArtist,
} from "@/app/lib/services/submit-data-types/artistService";
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
    const artist = await getArtistById(id, cookieStore);
    return NextResponse.json(artist);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const formData = await request.formData();
    const result = await createArtist(formData, cookieStore);
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request) {
  try {
    const cookieStore = await cookies();
    const formData = await request.formData();
    const result = await updateArtist(formData, cookieStore);
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}
