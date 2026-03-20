import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getLimitedNews,
  createNews,
  updateNews,
  deleteNews,
} from "@/app/lib/services/news/news";
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
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const result = await getLimitedNews({ limit, offset });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const formData = await request.formData();
    const result = await createNews(formData, cookieStore);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request) {
  try {
    const cookieStore = await cookies();
    const formData = await request.formData();
    const result = await updateNews(formData, cookieStore);
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request) {
  return PUT(request);
}

export async function DELETE(request) {
  try {
    const cookieStore = await cookies();
    const { newsId } = await request.json();
    const result = await deleteNews(newsId, cookieStore);
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}
