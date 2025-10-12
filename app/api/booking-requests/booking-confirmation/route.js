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

    const { booking_id } = await request.json();

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
      .select("id, requester_id, receiver_id, confirmed_by, response")
      .eq("id", booking_id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // 2. Check if user has access to this booking
    if (user.id !== booking.requester_id && user.id !== booking.receiver_id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // 3. Check if user already confirmed
    const confirmedBy = booking.confirmed_by || [];
    if (confirmedBy.includes(user.id)) {
      return NextResponse.json(
        { error: "You have already confirmed this booking" },
        { status: 400 }
      );
    }

    // 4. Add current user to confirmed_by array
    const newConfirmedBy = [...confirmedBy, user.id];
    
    // 5. Check if both users have now confirmed
    const bothUsersConfirmed = newConfirmedBy.length === 2 &&
                               newConfirmedBy.includes(booking.requester_id) &&
                               newConfirmedBy.includes(booking.receiver_id);

    // 6. Prepare update data
    const updateData = {
      confirmed_by: newConfirmedBy,
      updated_at: new Date().toISOString()
    };

    // 7. If both users confirmed, update response and add confirmed_at timestamp
    if (bothUsersConfirmed) {
      updateData.response = "confirmed";
      updateData.confirmed_at = new Date().toISOString();
    }

    // 8. Update the booking
    const { data: updatedBooking, error: updateError } = await supabase
      .from("booking_requests")
      .update(updateData)
      .eq("id", booking_id)
      .select("id, requester_id, receiver_id, confirmed_by, response, confirmed_at")
      .single();

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update booking" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedBooking,
      message: bothUsersConfirmed 
        ? "Booking confirmed by both parties!" 
        : "Waiting for the other party to confirm"
    });

  } catch (error) {
    console.error("Booking confirmation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}