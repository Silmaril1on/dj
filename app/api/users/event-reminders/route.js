import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createSupabaseServerClient,
  getServerUser,
} from "@/app/lib/config/supabaseServer";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const { user, error: userError } = await getServerUser(cookieStore);

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "User not authenticated" },
        { status: 401 },
      );
    }

    const supabase = await createSupabaseServerClient(cookieStore);

    const { data: likes, error: likesError } = await supabase
      .from("event_likes")
      .select("event_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (likesError) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch event reminders" },
        { status: 500 },
      );
    }

    const eventIds = [...new Set((likes || []).map((item) => item.event_id))];

    if (eventIds.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("id, country, city, artists, date, event_image, venue_name")
      .in("id", eventIds)
      .gte("date", todayStr);

    if (eventsError) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch events" },
        { status: 500 },
      );
    }

    const eventById = new Map((events || []).map((event) => [event.id, event]));
    const orderedEvents = eventIds
      .map((id) => eventById.get(id))
      .filter(Boolean);

    return NextResponse.json({
      success: true,
      data: orderedEvents,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
