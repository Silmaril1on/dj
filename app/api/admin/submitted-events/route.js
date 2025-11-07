import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";

export async function GET(request) {
  try {
    // ✅ OPTIMIZED: Get pending events with submitter data in ONE query using JOIN
    const { data: events, error: eventsError } = await supabaseAdmin
      .from("events")
      .select(`
        id,
        event_name,
        promoter,
        event_image,
        country,
        city,
        status,
        created_at,
        description,
        user_id,
        users:user_id(
          id,
          userName,
          email,
          user_avatar
        )
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (eventsError) {
      console.error("Events query error:", eventsError);
      return NextResponse.json({ error: eventsError.message, details: eventsError }, { status: 500 });
    }

    if (!events || events.length === 0) {
      return NextResponse.json({ submissions: [] });
    }

    // Transform the joined data into the expected format
    const submissions = events.map((event) => ({
      id: event.id,
      name: event.event_name,
      stage_name: event.promoter,
      artist_image: event.event_image,
      country: event.country,
      city: event.city,
      description: event.description,
      created_at: event.created_at,
      submitter: event.users
        ? {
            id: event.users.id,
            userName: event.users.userName,
            email: event.users.email,
            user_avatar: event.users.user_avatar,
          }
        : null,
    }));

    return NextResponse.json({ submissions });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const { eventId, action } = await request.json();
    if (!eventId || !action) {
      return NextResponse.json(
        { error: "Event ID and action are required" },
        { status: 400 }
      );
    }
    if (!["approve", "decline"].includes(action)) {
      return NextResponse.json(
        { error: "Action must be 'approve' or 'decline'" },
        { status: 400 }
      );
    }

    const newStatus = action === "approve" ? "approved" : "declined";
    const { error: updateError } = await supabaseAdmin
      .from("events")
      .update({ status: newStatus })
      .eq("id", eventId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Event ${action}d successfully`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
