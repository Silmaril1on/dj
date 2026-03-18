import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerUser } from "@/app/lib/config/supabaseServer";
import {
  createArtist,
  getArtistProfilePayload,
  updateArtist,
} from "@/app/lib/services/artists/artistProfile";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const artistId = searchParams.get("id");

    if (!slug && !artistId) {
      return NextResponse.json(
        { error: "Artist slug or ID is required" },
        { status: 400 },
      );
    }

    const cookieStore = await cookies();
    const { user } = await getServerUser(cookieStore);
    const artist = await getArtistProfilePayload({
      slug,
      artistId,
      userId: user?.id || null,
      cookieStore,
    });

    return NextResponse.json({
      artist: {
        ...artist,
        userSubmittedArtistId: user?.submitted_artist_id ?? null,
      },
    });
  } catch (error) {
    console.error("Error in GET get-artist-profile API:", error);
    const status = error.message === "Artist not found" ? 404 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function PUT(request) {
  try {
    const cookieStore = await cookies();
    const { user, error: userError } = await getServerUser(cookieStore);

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "User not authenticated" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const artistId = searchParams.get("id");

    if (!artistId) {
      return NextResponse.json(
        { error: "Artist ID is required" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { id, ...updateData } = body;
    const formData = new FormData();
    formData.append("artistId", artistId);

    Object.entries(updateData).forEach(([key, value]) => {
      if (value === null || value === undefined) return;
      if (Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
        return;
      }
      formData.append(key, String(value));
    });

    const result = await updateArtist(formData, cookieStore);

    return NextResponse.json({
      artist: result.data,
      message: result.message || "Artist updated successfully",
    });
  } catch (error) {
    console.error("Error in PUT get-artist-profile API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 },
    );
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const formData = await request.formData();
    const result = await createArtist(formData, cookieStore);
    return NextResponse.json(result);
  } catch (error) {
    const status = error.status || 500;
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status },
    );
  }
}

export async function PATCH(request) {
  try {
    const cookieStore = await cookies();
    const formData = await request.formData();
    const result = await updateArtist(formData, cookieStore);
    return NextResponse.json(result);
  } catch (error) {
    const status = error.status || 500;
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status },
    );
  }
}
