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
    const { id } = await params;
    const cookieStore = await cookies();
    const { user } = await getServerUser(cookieStore);
    const supabase = await createSupabaseServerClient(cookieStore);

    const [eventResult, likesResult] = await Promise.all([
      supabase.from("events").select("*").eq("id", id).single(),

      supabase.from("event_likes").select("user_id").eq("event_id", id),
    ]);

    if (eventResult.error || !eventResult.data) {
      return NextResponse.json(
        {
          success: false,
          error: eventResult.error?.message || "Event not found",
        },
        { status: 404 }
      );
    }

    const event = eventResult.data;
    const likesData = likesResult.data || [];

    const likesCount = likesData.length;
    const userLiked = user
      ? likesData.some((like) => like.user_id === user.id)
      : false;

    // Fetch artist details if artists exist
    let artistsWithIds = [];
    if (event.artists && event.artists.length > 0) {
      // Get all artists from database
      const { data: allArtistsData } = await supabase
        .from("artists")
        .select("id, name, stage_name");

      if (allArtistsData) {
        // Create a map for quick lookup (normalized name -> artist)
        const artistMap = new Map();
        allArtistsData.forEach((artist) => {
          const normalizedName = normalizeArtistName(artist.name);
          const normalizedStageName = normalizeArtistName(artist.stage_name);

          if (normalizedName) artistMap.set(normalizedName, artist);
          if (normalizedStageName) artistMap.set(normalizedStageName, artist);
        });

        // Map artist names to their IDs with normalized matching
        artistsWithIds = event.artists.map((artistName) => {
          const normalizedSearchName = normalizeArtistName(artistName);
          const foundArtist = artistMap.get(normalizedSearchName);

          return foundArtist
            ? {
                name: artistName, // Keep original name from event
                id: foundArtist.id,
              }
            : { name: artistName, id: null };
        });
      }
    }

    return NextResponse.json({
      ...event,
      artists: artistsWithIds.length > 0 ? artistsWithIds : event.artists,
      likesCount,
      userLiked,
      currentUserId: user?.id || null,
      success: true,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
