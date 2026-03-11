import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/app/lib/config/supabaseServer";

export async function GET(request, { params }) {
  try {
    const { id: clubId } = await params;

    if (!clubId) {
      return NextResponse.json(
        { success: false, error: "Club ID is required" },
        { status: 400 },
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);

    const { data: clubDates, error } = await supabase
      .from("club_dates")
      .select(
        "id, club_id, date, time, event_link, event_title, minimum_age, event_status, created_at",
      )
      .eq("club_id", clubId)
      .order("date", { ascending: true })
      .order("id", { ascending: true })
      .range(offset, offset + limit);

    if (error) {
      console.error("Error fetching club dates:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch club dates" },
        { status: 500 },
      );
    }

    const hasMore = (clubDates || []).length > limit;
    const trimmed = hasMore ? clubDates.slice(0, limit) : clubDates || [];

    const scheduleData = trimmed.map((item) => ({
      id: item.id,
      date: item.date,
      time: item.time || "TBA",
      event_link: item.event_link,
      event_title: item.event_title,
      event_name: item.event_title,
      minimum_age: item.minimum_age,
      event_status: item.event_status || "upcoming",
      created_at: item.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: scheduleData,
      hasMore,
      nextOffset: hasMore ? offset + limit : null,
    });
  } catch (err) {
    console.error("Unexpected error in GET /api/club/[id]/club-dates:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
