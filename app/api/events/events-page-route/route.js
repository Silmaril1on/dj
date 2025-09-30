import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/app/lib/config/supabaseServer";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);

    // Fetch events
    const { data: events, error } = await supabase
      .from("events")
      .select("id, event_image, event_name, date, country, city, artists")
      .order("date", { ascending: true }) // ascending: true for soonest first
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch likes count for all events in one query
    const eventIds = events.map((e) => e.id);
    let likesCountMap = {};
    if (eventIds.length > 0) {
      const { data: likesData } = await supabase
        .from("event_likes")
        .select("event_id, user_id");

      // Count likes per event
      likesData?.forEach((like) => {
        likesCountMap[like.event_id] = (likesCountMap[like.event_id] || 0) + 1;
      });
    }

    // Attach likesCount to each event
    const eventsWithLikes = events.map((event) => ({
      ...event,
      likesCount: likesCountMap[event.id] || 0,
    }));

    return NextResponse.json({ data: eventsWithLikes });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}