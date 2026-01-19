import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";

// GET /api/reservation/notifications - Fetch notifications for a restaurant
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get("restaurant_id");
    const status = searchParams.get("status"); // pending, sent, failed

    if (!restaurantId) {
      return NextResponse.json(
        { error: "Restaurant ID is required" },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from("rest_notifications")
      .select(
        `
        *,
        reservations(
          id,
          restaurant_id,
          reservation_date,
          reservation_time,
          guest_count,
          status,
          reservation_token,
          guests(
            id,
            full_name,
            email,
            phone,
            notes
          )
        )
      `
      )
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error("Error fetching notifications:", error);
      return NextResponse.json(
        { error: "Failed to fetch notifications" },
        { status: 500 }
      );
    }

    // Filter by restaurant_id in JavaScript since we removed the column
    let filteredNotifications = notifications;
    if (restaurantId) {
      filteredNotifications = notifications.filter(
        (notif) => notif.reservations?.restaurant_id === parseInt(restaurantId)
      );
    }

    return NextResponse.json(
      { notifications: filteredNotifications },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in GET /api/reservation/notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/reservation/notifications - Update notification status
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { notification_id, status } = body;

    if (!notification_id || !status) {
      return NextResponse.json(
        { error: "Notification ID and status are required" },
        { status: 400 }
      );
    }

    const validStatuses = ["pending", "sent", "failed"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be: pending, sent, or failed" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("rest_notifications")
      .update({
        status,
        sent_at: status === "sent" ? new Date().toISOString() : null,
      })
      .eq("id", notification_id)
      .select()
      .single();

    if (error) {
      console.error("Error updating notification:", error);
      return NextResponse.json(
        { error: "Failed to update notification" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Notification updated successfully",
        notification: data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in PATCH /api/reservation/notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
