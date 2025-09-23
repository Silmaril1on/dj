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

    if (userError) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication failed",
          details: userError.message,
        },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not authenticated" },
        { status: 401 }
      );
    }

    const supabase = await createSupabaseServerClient(cookieStore);

    // Fetch submitted_event_id array for this user
    const { data: userData, error: userFetchError } = await supabase
      .from("users")
      .select("submitted_event_id")
      .eq("id", user.id)
      .single();

    if (userFetchError) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch user submitted events",
          details: userFetchError.message,
        },
        { status: 500 }
      );
    }

    const submittedIds = userData?.submitted_event_id || [];
    const totalSubmittedEvents = submittedIds.length;

    let recentEvents = [];
    if (totalSubmittedEvents > 0) {
      const { data, error: eventsError } = await supabase
        .from("events")
        .select(
          "id, event_name, promoter, event_image, created_at, city, country, date"
        )
        .in("id", submittedIds)
        .order("created_at", { ascending: false })
        .limit(5);

      if (eventsError) {
        return NextResponse.json(
          {
            success: false,
            error: "Failed to fetch submitted events",
            details: eventsError.message,
          },
          { status: 500 }
        );
      }

      recentEvents = data || [];
    }

    return NextResponse.json({
      success: true,
      data: {
        totalSubmittedEvents,
        recentEvents,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
