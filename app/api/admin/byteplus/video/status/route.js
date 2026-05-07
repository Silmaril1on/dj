import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerUser } from "@/app/lib/config/supabaseServer";

const BASE_URL = process.env.BYTEPLUS_BASE_URL;
const API_KEY = process.env.BYTEPLUS_API_KEY;

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const { user } = await getServerUser(cookieStore);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");

    if (!taskId || !/^[a-zA-Z0-9_-]+$/.test(taskId)) {
      return NextResponse.json(
        { error: "Valid taskId is required" },
        { status: 400 },
      );
    }

    const response = await fetch(
      `${BASE_URL}/contents/generations/tasks/${taskId}`,
      {
        headers: { Authorization: `Bearer ${API_KEY}` },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "BytePlus API error" },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[byteplus/video/status]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
