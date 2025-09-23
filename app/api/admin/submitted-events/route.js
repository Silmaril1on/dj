import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";

export async function GET(request) {
  try {
    // Get all pending events
    const { data: events, error: eventsError } = await supabaseAdmin
      .from("events")
      .select(
        "id, event_name, promoter, event_image, country, city, status, created_at, description"
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (eventsError) {
      return NextResponse.json({ error: eventsError.message }, { status: 500 });
    }
    if (!events || events.length === 0) {
      return NextResponse.json({ submissions: [] });
    }

    const eventIds = events.map((e) => e.id);

    // Get users who submitted these events (submitted_event_id is an array)
    const { data: users, error: usersError } = await supabaseAdmin
      .from("users")
      .select(
        `
        id,
        userName,
        email,
        user_avatar,
        submitted_event_id
      `
      )
      .overlaps("submitted_event_id", eventIds);

    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    // Map event_id to user who submitted it
    const userMap = {};
    users?.forEach((user) => {
      const ids = user.submitted_event_id || [];
      ids.forEach((id) => {
        if (!userMap[id]) {
          userMap[id] = user;
        }
      });
    });

    // Shape submissions for UI (reuse artist card structure)
    const submissions = events.map((event) => ({
      id: event.id,
      name: event.event_name,
      stage_name: event.promoter,
      artist_image: event.event_image,
      country: event.country,
      city: event.city,
      description: event.description,
      created_at: event.created_at,
      submitter: userMap[event.id]
        ? {
            id: userMap[event.id].id,
            userName: userMap[event.id].userName,
            email: userMap[event.id].email,
            user_avatar: userMap[event.id].user_avatar,
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
