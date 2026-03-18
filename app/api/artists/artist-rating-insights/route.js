import { NextResponse } from "next/server";
import { getArtistRatingInsights } from "@/app/lib/services/artists/getRatingInsights";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const artistId = searchParams.get("artistId");

    if (!artistId) {
      return NextResponse.json(
        { error: "Artist ID is required" },
        { status: 400 },
      );
    }

    const result = await getArtistRatingInsights(artistId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in artist rating insights API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
