import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getFestivalLikes,
  toggleFestivalLike,
} from "@/app/lib/services/festivals/festivalLikes";

export async function GET(request) {
  const cookieStore = await cookies();
  const festivalId = new URL(request.url).searchParams.get("festivalId");
  const result = await getFestivalLikes(cookieStore, festivalId);
  return NextResponse.json({ success: true, ...result });
}

export async function POST(request) {
  const cookieStore = await cookies();
  const { festivalId } = await request.json();
  const result = await toggleFestivalLike(cookieStore, festivalId);
  return NextResponse.json({ success: true, ...result });
}
