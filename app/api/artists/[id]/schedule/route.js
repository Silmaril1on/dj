import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/lib/config/supabaseServer";
import { cookies } from "next/headers";

export async function GET(request, { params }) {
  try {
    const { id: artistId } = await params;

    if (!artistId) {
      return NextResponse.json(
        { error: "Artist ID is required" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);

    // Get artist schedule - only approved events
    const { data: scheduleData, error: scheduleError } = await supabase
      .from("artist_schedule")
      .select("*")
      .eq("artist_id", artistId)
      .eq("status", "approved")
      .order("date", { ascending: true });

    if (scheduleError) {
      console.error("Error fetching artist schedule:", scheduleError);
      return NextResponse.json(
        { error: "Failed to fetch schedule" },
        { status: 500 }
      );
    }

    // Also try to find events in the `events` table that include this artist
    // in their `artists` array regardless of case (handles different casings)
    try {
      const { data: artistRecord } = await supabase
        .from("artists")
        .select("id, name, stage_name")
        .eq("id", artistId)
        .single();

      if (artistRecord) {
        // Fetch approved events (limit to reasonable number)
        const { data: eventsData, error: eventsError } = await supabase
          .from("events")
          .select("*")
          .eq("status", "approved")
          .order("date", { ascending: true })
          .limit(1000);

        if (!eventsError && eventsData && eventsData.length) {
          const namesToMatch = [artistRecord.stage_name, artistRecord.name]
            .filter(Boolean)
            .map((n) => n.toLowerCase());

          const matchingFromEvents = eventsData.filter((ev) => {
            if (!ev.artists || !Array.isArray(ev.artists)) return false;
            return ev.artists.some((a) =>
              namesToMatch.includes(String(a).toLowerCase())
            );
          });

          // Transform matching events into the same shape as artist_schedule rows
          const transformed = matchingFromEvents.map((ev) => ({
            // Use a string id to avoid colliding with numeric schedule ids
            id: `evt-${ev.id}`,
            artist_id: parseInt(artistId, 10),
            event_id: ev.id,
            date: ev.date,
            time: ev.doors_open || ev.time || null,
            country: ev.country,
            city: ev.city,
            club_name: ev.venue_name || ev.club_name || null,
            event_link: ev.location_url || (ev.links && ev.links[0]) || null,
            event_title: ev.event_name || null,
            event_type: ev.event_type || null,
            event_image: ev.event_image || null,
            status: "approved",
            created_at: ev.created_at || null,
            updated_at: ev.updated_at || null,
          }));

          console.log(
            `✅ Transformed ${transformed.length} events for artist ${artistId}`
          );

          // Merge without duplicates (by event_id)
          const existingEventIds = new Set(
            (scheduleData || []).map((s) => s.event_id).filter(Boolean)
          );

          const merged = [...(scheduleData || [])];
          transformed.forEach((t) => {
            if (!existingEventIds.has(t.event_id)) merged.push(t);
          });

          return NextResponse.json({ success: true, data: merged });
        }
      }
    } catch (e) {
      console.error("Error fetching matching events:", e);
      // fallthrough to return scheduleData
    }

    return NextResponse.json({
      success: true,
      data: scheduleData || [],
    });
  } catch (error) {
    console.error("Schedule API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
