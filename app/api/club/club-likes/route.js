import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getClubLikes,
  toggleClubLike,
} from "@/app/lib/services/clubs/clubLikes";

export async function GET(request) {
  const cookieStore = await cookies();
  const clubId = new URL(request.url).searchParams.get("clubId");
  const result = await getClubLikes(cookieStore, clubId);
  return NextResponse.json({ success: true, ...result });
}

export async function POST(request) {
  const cookieStore = await cookies();
  const { clubId } = await request.json();
  const result = await toggleClubLike(cookieStore, clubId);
  return NextResponse.json({ success: true, ...result });
}
