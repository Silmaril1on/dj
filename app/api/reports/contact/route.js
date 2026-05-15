import { NextResponse } from "next/server";
import { submitContact } from "@/app/lib/services/admin/reports/bugsAndFeedbacks";

export async function POST(request) {
  try {
    const { full_name, user_email, title, content } = await request.json();
    const result = await submitContact({
      full_name,
      user_email,
      title,
      content,
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: err.status || 500 },
    );
  }
}
