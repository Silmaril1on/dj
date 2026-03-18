import { NextResponse } from "next/server";
import { getServerUser } from "@/app/lib/config/supabaseServer";
import { cookies } from "next/headers";
import {
  getArtistLikes,
  toggleArtistLike,
} from "@/app/lib/services/artists/artistLikes";

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

    const cookieStore = await cookies();
    const { user } = await getServerUser(cookieStore);
    const result = await getArtistLikes(
      artistId,
      cookieStore,
      user?.id ?? null,
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Error in GET likes API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const { user, error: userError } = await getServerUser(cookieStore);

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: userError?.message || "User not authenticated",
        },
        { status: 401 },
      );
    }

    const { artistId } = await request.json();

    if (!artistId) {
      return NextResponse.json(
        { error: "Artist ID is required" },
        { status: 400 },
      );
    }

    const result = await toggleArtistLike(artistId, cookieStore);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Error in like API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 },
    );
  }
}
