import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createSupabaseServerClient,
  getServerUser,
} from "@/app/lib/config/supabaseServer";

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const { user, error: userError } = await getServerUser(cookieStore);

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "User not authenticated" },
        { status: 401 }
      );
    }

    const supabase = await createSupabaseServerClient(cookieStore);

    // Get user's submitted artist ID
    const { data: userData, error: userDataError } = await supabase
      .from("users")
      .select("submitted_artist_id")
      .eq("id", user.id)
      .single();

    if (userDataError) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch user data" },
        { status: 500 }
      );
    }

    const artistId = userData?.submitted_artist_id;

    if (!artistId) {
      return NextResponse.json({
        success: true,
        data: [],
        message: "No artist associated with this user",
      });
    }

    // Fetch all pending events for this artist
    const { data: pendingEvents, error: eventsError } = await supabase
      .from("artist_schedule")
      .select("*")
      .eq("artist_id", artistId)
      .eq("status", "pending")
      .order("date", { ascending: true });

    if (eventsError) {
      console.error("Error fetching pending events:", eventsError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch pending events" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: pendingEvents || [],
      artistId,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const cookieStore = await cookies();
    const { user, error: userError } = await getServerUser(cookieStore);

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "User not authenticated" },
        { status: 401 }
      );
    }

    const supabase = await createSupabaseServerClient(cookieStore);
    const { scheduleId, action } = await request.json();

    if (!scheduleId || !action) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (action === "approve") {
      // Update status to approved
      const { data, error } = await supabase
        .from("artist_schedule")
        .update({ 
          status: "approved",
          updated_at: new Date().toISOString()
        })
        .eq("id", scheduleId)
        .select()
        .single();

      if (error) {
        console.error("Error approving event:", error);
        return NextResponse.json(
          { success: false, error: "Failed to approve event" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Event approved successfully",
        data,
      });
    } else if (action === "decline") {
      // Delete the pending event request
      const { error } = await supabase
        .from("artist_schedule")
        .delete()
        .eq("id", scheduleId);

      if (error) {
        console.error("Error declining event:", error);
        return NextResponse.json(
          { success: false, error: "Failed to decline event" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Event declined successfully",
      });
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid action" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error in PATCH /api/users/artist-event-request:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
