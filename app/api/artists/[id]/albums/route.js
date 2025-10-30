import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";

export async function GET(request, { params }) {
  try {
    const { id: artistId } = await params;

    if (!artistId) {
      return NextResponse.json(
        { error: "Artist ID is required" },
        { status: 400 }
      );
    }

    // Get artist albums
    const { data: albumsData, error: albumsError } = await supabaseAdmin
      .from("artist_albums")
      .select("*")
      .eq("artist_id", artistId)
      .order("release_date", { ascending: false });

    if (albumsError) {
      console.error("Error fetching artist albums:", albumsError);
      return NextResponse.json(
        { error: "Failed to fetch albums" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: albumsData || [],
    });
  } catch (error) {
    console.error("Albums API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
