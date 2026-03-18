import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getArtistById } from "@/app/lib/services/artists/artistProfile";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Artist ID is required" },
        { status: 400 },
      );
    }

    const cookieStore = await cookies();
    const artist = await getArtistById(id, cookieStore);

    return NextResponse.json(artist);
  } catch (error) {
    console.error("Error fetching artist by ID:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 },
    );
  }
}
