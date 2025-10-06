import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/app/lib/config/supabaseServer";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);

    // Get artists count
    const { count: artistsCount, error: artistsError } = await supabase
      .from("artists")
      .select("*", { count: "exact", head: true });

    // Get clubs count
    const { count: clubsCount, error: clubsError } = await supabase
      .from("clubs")
      .select("*", { count: "exact", head: true });

    // Get events count
    const { count: eventsCount, error: eventsError } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true });

    // Get news count
    const { count: newsCount, error: newsError } = await supabase
      .from("news")
      .select("*", { count: "exact", head: true });

    // Check for any errors
    if (artistsError || clubsError || eventsError || newsError) {
      const errors = [artistsError, clubsError, eventsError, newsError]
        .filter(Boolean)
        .map(err => err.message);
      
      return NextResponse.json(
        { error: `Database error: ${errors.join(", ")}` },
        { status: 500 }
      );
    }

    // Return stats
    const stats = {
      artists: artistsCount || 0,
      clubs: clubsCount || 0,
      events: eventsCount || 0,
      news: newsCount || 0,
      total: (artistsCount || 0) + (clubsCount || 0) + (eventsCount || 0) + (newsCount || 0)
    };

    return NextResponse.json({ success: true, stats });

  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch app statistics" },
      { status: 500 }
    );
  }
}