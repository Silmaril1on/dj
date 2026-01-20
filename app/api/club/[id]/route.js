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
    const { user, error: userError } = await getServerUser(cookieStore);
    const supabase = await createSupabaseServerClient(cookieStore);

    // ✅ OPTIMIZED: Fetch club and events in parallel
    const [clubResult, eventsResult] = await Promise.all([
      supabase.from("clubs").select("*").eq("id", id).single(),

      supabase
        .from("events")
        .select("id, date, doors_open, country, city, venue_name, links")
        .eq("club_id", id)
        .eq("status", "approved")
        .order("date", { ascending: true }),
    ]);

    if (clubResult.error || !clubResult.data) {
      return NextResponse.json(
        { error: clubResult.error?.message || "Club not found" },
        { status: 404 },
      );
    }

    const club = clubResult.data;
    const events = eventsResult.data || [];

    // Fetch resident artist details if residents exist
    let residentsWithIds = [];
    if (club.residents && club.residents.length > 0) {
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

        // Map resident names to their IDs with normalized matching
        residentsWithIds = club.residents.map((residentName) => {
          const normalizedSearchName = normalizeArtistName(residentName);
          const foundArtist = artistMap.get(normalizedSearchName);

          return foundArtist
            ? {
                name: residentName, // Keep original name from club
                id: foundArtist.id,
                artist_slug: foundArtist.artist_slug,
              }
            : { name: residentName, id: null, artist_slug: null };
        });
      }
    }

    // Prepare schedule data for ArtistSchedule component
    const clubSchedule = events.map((event) => ({
      id: event.id,
      date: event.date,
      time: event.doors_open,
      country: event.country,
      city: event.city,
      club_name: event.venue_name,
      event_link: event.links || null,
    }));

    return NextResponse.json({
      club: {
        ...club,
        residents:
          residentsWithIds.length > 0 ? residentsWithIds : club.residents,
      },
      currentUserId: user?.id || null,
      clubSchedule,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
