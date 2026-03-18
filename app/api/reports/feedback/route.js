import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getFeedbacks,
  submitFeedback,
  approveFeedback,
} from "@/app/lib/services/admin/reports/bugsAndFeedbacks";

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";
    const feedbacks = await getFeedbacks(cookieStore, { status });
    return NextResponse.json({ feedbacks });
  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: err.status || 500 },
    );
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const { title, content, rating } = await request.json();
    const result = await submitFeedback(cookieStore, {
      title,
      content,
      rating,
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: err.status || 500 },
    );
  }
}

export async function PATCH(request) {
  try {
    const cookieStore = await cookies();
    const { id } = await request.json();
    const result = await approveFeedback(cookieStore, id);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: err.status || 500 },
    );
  }
}
