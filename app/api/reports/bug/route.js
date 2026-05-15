import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getReports,
  submitReport,
  deleteReport,
} from "@/app/lib/services/admin/reports/bugsAndFeedbacks";

export async function GET() {
  try {
    const reports = await getReports();
    return NextResponse.json({ reports });
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
    const { title, content } = await request.json();
    const result = await submitReport(cookieStore, { title, content });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: err.status || 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    const { id } = await request.json();
    const result = await deleteReport(id);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: err.status || 500 },
    );
  }
}
