import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/app/lib/config/supabaseServer";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "15", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);

    // ✅ OPTIMIZED: Fetch events and likes in parallel
    const [eventsResult, likesResult] = await Promise.all([
      supabase
        .from("events")
        .select("id, event_image, event_name, date, country, city, artists")
        .order("date", { ascending: true })
        .range(offset, offset + limit - 1),
      
      supabase
        .from("event_likes")
        .select("event_id")
    ]);

    if (eventsResult.error) {
      return NextResponse.json({ error: eventsResult.error.message }, { status: 500 });
    }

    const events = eventsResult.data || [];
    const likesData = likesResult.data || [];

    // Build likes count map
    const likesCountMap = {};
    likesData.forEach((like) => {
      likesCountMap[like.event_id] = (likesCountMap[like.event_id] || 0) + 1;
    });

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