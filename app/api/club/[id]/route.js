import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient, getServerUser } from "@/app/lib/config/supabaseServer";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const { user, error: userError } = await getServerUser(cookieStore);
    const supabase = await createSupabaseServerClient(cookieStore);

    // ✅ OPTIMIZED: Fetch club and events in parallel
    const [clubResult, eventsResult] = await Promise.all([
      supabase
        .from("clubs")
        .select("*")
        .eq("id", id)
        .single(),
      
      supabase
        .from("events")
        .select("id, date, doors_open, country, city, venue_name, links")
        .eq("club_id", id)
        .eq("status", "approved")
        .order("date", { ascending: true })
    ]);

    if (clubResult.error || !clubResult.data) {
      return NextResponse.json(
        { error: clubResult.error?.message || "Club not found" }, 
        { status: 404 }
      );
    }

    const club = clubResult.data;
    const events = eventsResult.data || [];

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
      club,
      currentUserId: user?.id || null,
      clubSchedule,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}