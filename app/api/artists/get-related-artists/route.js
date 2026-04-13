import { NextResponse } from "next/server";
import { getRelatedArtists } from "@/app/lib/services/artists/getRelatedArtists";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const artistId = searchParams.get("artistId");
    const genresParam = searchParams.get("genres");

    if (!artistId || !genresParam) {
      return NextResponse.json({ artists: [] });
    }

    const genres = genresParam
      .split(",")
      .map((g) => g.trim())
      .filter(Boolean);

    const artists = await getRelatedArtists(artistId, genres);
    return NextResponse.json({ artists });
  } catch (err) {
    console.error("Related artists error:", err);
    return NextResponse.json({ artists: [] });
  }
}
