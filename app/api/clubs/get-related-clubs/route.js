import { NextResponse } from "next/server";
import { getRelatedClubs } from "@/app/lib/services/clubs/getRelatedClubs";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const clubId = searchParams.get("clubId");
    const country = searchParams.get("country");

    if (!clubId || !country) {
      return NextResponse.json({ clubs: [] });
    }

    const clubs = await getRelatedClubs(clubId, country);
    return NextResponse.json({ clubs });
  } catch (err) {
    console.error("Related clubs error:", err);
    return NextResponse.json({ clubs: [] });
  }
}
