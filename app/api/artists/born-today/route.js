import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBornTodayArtists } from "@/app/lib/services/artists/getBornTodayArtists";

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const artistsWithAge = await getBornTodayArtists(cookieStore);

    return NextResponse.json({
      success: true,
      data: artistsWithAge,
      count: artistsWithAge.length,
    });
  } catch (error) {
    console.error("Error fetching artists born today:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 },
    );
  }
}
