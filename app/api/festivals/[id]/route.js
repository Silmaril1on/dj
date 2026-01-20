import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createSupabaseServerClient,
  getServerUser,
} from "@/app/lib/config/supabaseServer";

// Helper to normalize artist names (remove parentheses content)
const normalizeArtistName = (name) => {
  if (!name) return "";
  return name
    .replace(/\s*\([^)]*\)/g, "")
    .trim()
    .toLowerCase();
};

export async function GET(request, { params }) {
  try {
    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);

    const { id: festivalId } = await params;

    if (!festivalId) {
      return NextResponse.json(
        { success: false, error: "Festival ID is required" },
        { status: 400 },
      );
    }

    // Get current user
    const { user } = await getServerUser(cookieStore);
    const currentUserId = user?.id || null;

    // Fetch festival data
    const { data: festival, error } = await supabase
      .from("festivals")
      .select("*")
      .eq("id", festivalId)
      .single();

    if (error) {
      console.error("Error fetching festival:", error);
      return NextResponse.json(
        { success: false, error: "Festival not found" },
        { status: 404 },
      );
    }

    // Fetch lineup artist details if lineup exists
    let lineupWithIds = [];
    if (festival.lineup && festival.lineup.length > 0) {
      // Get all artists from database
      const { data: allArtistsData } = await supabase
        .from("artists")
        .select("id, name, stage_name, artist_slug");

      if (allArtistsData) {
        // Create a map for quick lookup (normalized name -> artist)
        const artistMap = new Map();
        allArtistsData.forEach((artist) => {
          const normalizedName = normalizeArtistName(artist.name);
          const normalizedStageName = normalizeArtistName(artist.stage_name);

          if (normalizedName) artistMap.set(normalizedName, artist);
          if (normalizedStageName) artistMap.set(normalizedStageName, artist);
        });

        // Map lineup artist names to their IDs with normalized matching
        lineupWithIds = festival.lineup.map((artistName) => {
          const normalizedSearchName = normalizeArtistName(artistName);
          const foundArtist = artistMap.get(normalizedSearchName);

          return foundArtist
            ? {
                name: artistName, // Keep original name from festival
                id: foundArtist.id,
                artist_slug: foundArtist.artist_slug,
              }
            : { name: artistName, id: null, artist_slug: null };
        });
      }
    }

    return NextResponse.json({
      success: true,
      festival: {
        ...festival,
        lineup: lineupWithIds.length > 0 ? lineupWithIds : festival.lineup,
      },
      currentUserId: currentUserId,
    });
  } catch (err) {
    console.error("Unexpected error in GET /api/festivals/[id]:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
