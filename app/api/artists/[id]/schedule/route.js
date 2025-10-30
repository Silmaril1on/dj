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
