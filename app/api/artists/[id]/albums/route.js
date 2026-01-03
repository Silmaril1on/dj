import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";

export async function GET(request, { params }) {
  try {
    const { id: artistId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit")) || null;

    if (!artistId) {
      return NextResponse.json(
        { error: "Artist ID is required" },
        { status: 400 }
      );
    }

    // Get total count first
    const { count, error: countError } = await supabaseAdmin
      .from("artist_albums")
      .select("*", { count: "exact", head: true })
      .eq("artist_id", artistId);

    if (countError) {
      console.error("Error counting albums:", countError);
      return NextResponse.json(
        { error: "Failed to count albums" },
        { status: 500 }
      );
    }

    // Build query with optional limit
    let query = supabaseAdmin
      .from("artist_albums")
      .select("*")
      .eq("artist_id", artistId)
      .order("release_date", { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data: albumsData, error: albumsError } = await query;

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
      hasMore: limit ? count > limit : false,
      total: count,
    });
  } catch (error) {
    console.error("Albums API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
