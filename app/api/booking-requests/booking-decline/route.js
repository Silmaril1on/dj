import { NextResponse } from "next/server";
import {
  createSupabaseServerClient,
  getServerUser,
} from "@/app/lib/config/supabaseServer";
import { cookies } from "next/headers";

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const { user, error: userError } = await getServerUser(cookieStore);

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const { booking_id, reason } = await request.json();

    if (!booking_id) {
      return NextResponse.json(
        { error: "booking_id is required" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient(cookieStore);

    // 1. Get the current booking
    const { data: booking, error: bookingError } = await supabase
      .from("booking_requests")
      .select("id, requester_id, receiver_id, response, event_name")
      .eq("id", booking_id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // 2. Check if user is the receiver (DJ) who can decline
    if (user.id !== booking.receiver_id) {
      return NextResponse.json({ error: "Only the receiver can decline bookings" }, { status: 403 });
    }

    // 3. Check if booking is already responded to
    if (booking.response !== null) {
      return NextResponse.json(
        { error: `Booking has already been ${booking.response}` },
        { status: 400 }
      );
    }

    // 4. Update booking to declined
    const updateData = {
      response: "declined",
      declined_at: new Date().toISOString(),
      decline_reason: reason || null,
      updated_at: new Date().toISOString()
    };

    const { data: updatedBooking, error: updateError } = await supabase
      .from("booking_requests")
      .update(updateData)
      .eq("id", booking_id)
      .select("id, requester_id, receiver_id, response, declined_at, event_name")
      .single();

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to decline booking" },
        { status: 500 }
      );
    }

    // 5. Get receiver (DJ) info for notification
    const { data: receiverInfo, error: receiverError } = await supabase
      .from("users")
      .select("userName, full_name")
      .eq("id", booking.receiver_id)
      .single();

    // 6. Create notification for requester
    const djName = receiverInfo?.userName || receiverInfo?.full_name || "DJ";
    const notificationData = {
      user_id: booking.requester_id,
      type: "booking_declined",
      title: "Booking Request Declined",
      message: `${djName} has declined your booking request for "${booking.event_name}".`,
      data: {
        booking_id: booking.id,
        declined_by: booking.receiver_id,
        event_name: booking.event_name,
        reason: reason
      },
      created_at: new Date().toISOString(),
      read: false
    };

    const { error: notificationError } = await supabase
      .from("notifications")
      .insert(notificationData);

    if (notificationError) {
      console.error("Notification error:", notificationError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      success: true,
      data: updatedBooking,
      message: "Booking declined successfully. The requester has been notified."
    });

  } catch (error) {
    console.error("Booking decline error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}