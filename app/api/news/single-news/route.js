import { NextResponse } from "next/server";
import { getNewsById } from "@/app/lib/services/news/news";
import { ServiceError } from "@/app/lib/services/shared";

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
    const id = new URL(request.url).searchParams.get("id");
    const result = await getNewsById(id);
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}
