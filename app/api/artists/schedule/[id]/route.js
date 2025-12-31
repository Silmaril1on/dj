import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerUser, supabaseAdmin } from "@/app/lib/config/supabaseServer";

export async function PUT(request, { params }) {
  try {
    const { id: scheduleId } = await params;

    if (!scheduleId) {
      return NextResponse.json(
        { error: "Schedule ID is required" },
        { status: 400 }
      );
    }

    // Get the current user
    const cookieStore = await cookies();
    const { user, error: userError } = await getServerUser(cookieStore);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get the schedule event to check permissions
    const { data: scheduleEvent, error: fetchError } = await supabaseAdmin
      .from("artist_schedule")
      .select("*, artists!inner(id, user_id)")
      .eq("id", scheduleId)
      .single();

    if (fetchError || !scheduleEvent) {
      return NextResponse.json(
        { error: "Schedule event not found" },
        { status: 404 }
      );
    }

    // Check permissions: admin or artist owner
    const isAdmin = user.is_admin;
    const isOwner = user.submitted_artist_id === scheduleEvent.artist_id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: "You don't have permission to edit this event" },
        { status: 403 }
      );
    }

    // Get update data from request
    const updateData = await request.json();

    // Validate required fields
    if (
      !updateData.date ||
      !updateData.time ||
      !updateData.country ||
      !updateData.club_name
    ) {
      return NextResponse.json(
        { error: "Missing required fields: date, time, country, club_name" },
        { status: 400 }
      );
    }

    // Prepare update object
    const eventUpdate = {
      date: updateData.date,
      time: updateData.time,
      country: updateData.country,
      city: updateData.city || null,
      club_name: updateData.club_name,
      event_link: updateData.event_link || null,
      updated_at: new Date().toISOString(),
    };

    // Update the schedule event
    const { data: updatedEvent, error: updateError } = await supabaseAdmin
      .from("artist_schedule")
      .update(eventUpdate)
      .eq("id", scheduleId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating schedule event:", updateError);
      return NextResponse.json(
        { error: "Failed to update event", details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Event updated successfully",
      data: updatedEvent,
    });
  } catch (error) {
    console.error("Schedule update API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id: scheduleId } = await params;

    if (!scheduleId) {
      return NextResponse.json(
        { error: "Schedule ID is required" },
        { status: 400 }
      );
    }

    // Get the current user
    const cookieStore = await cookies();
    const { user, error: userError } = await getServerUser(cookieStore);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get the schedule event to check permissions
    const { data: scheduleEvent, error: fetchError } = await supabaseAdmin
      .from("artist_schedule")
      .select("*, artists!inner(id, user_id)")
      .eq("id", scheduleId)
      .single();

    if (fetchError || !scheduleEvent) {
      return NextResponse.json(
        { error: "Schedule event not found" },
        { status: 404 }
      );
    }

    // Check permissions: admin or artist owner
    const isAdmin = user.is_admin;
    const isOwner = user.submitted_artist_id === scheduleEvent.artist_id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: "You don't have permission to delete this event" },
        { status: 403 }
      );
    }

    // Delete the schedule event
    const { error: deleteError } = await supabaseAdmin
      .from("artist_schedule")
      .delete()
      .eq("id", scheduleId);

    if (deleteError) {
      console.error("Error deleting schedule event:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete event", details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("Schedule delete API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
