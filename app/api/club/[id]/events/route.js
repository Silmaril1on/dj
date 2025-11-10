import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/app/lib/config/supabaseServer";

export async function GET(request, { params }) {
  try {
    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);
    
    const { id: clubId } = await params;

    if (!clubId) {
      return NextResponse.json(
        { success: false, error: "Club ID is required" },
        { status: 400 }
      );
    }

    // Fetch events for this specific club
    const { data: events, error } = await supabase
      .from("events")
      .select(`
        id,
        event_name,
        venue_name,
        date,
        doors_open,
        country,
        city,
        address,
        links,
        event_type,
        artists,
        created_at
      `)
      .eq("club_id", clubId)
      .eq("status", "approved")
      .order("date", { ascending: true });

    if (error) {
      console.error("Error fetching club events:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch events" },
        { status: 500 }
      );
    }

    // Transform the data to match the expected schedule format
    const scheduleData = events?.map((event) => ({
      id: event.id,
      event_id: event.id,
      date: event.date,
      time: event.doors_open || "TBA",
      country: event.country,
      city: event.city,
      club_name: event.venue_name,
      event_link: event.links,
      event_name: event.event_name,
      event_type: event.event_type,
      artists: event.artists,
      address: event.address,
      created_at: event.created_at
    })) || [];

    return NextResponse.json({
      success: true,
      data: scheduleData,
    });
  } catch (err) {
    console.error("Unexpected error in GET /api/club/[id]/events:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}