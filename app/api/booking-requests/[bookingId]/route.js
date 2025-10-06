import { NextResponse } from "next/server";
import {
  createSupabaseServerClient,
  getServerUser,
} from "@/app/lib/config/supabaseServer";
import { cookies } from "next/headers";

export async function GET(request, { params }) {
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
    const { bookingId } = await params;

    // 1. Fetch the specific booking request
    const { data: booking, error: bookingError } = await supabase
      .from("booking_requests")
      .select("*")
      .eq("id", bookingId)
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`) 
      .single();

    if (bookingError) {
      return NextResponse.json({ error: bookingError.message }, { status: 400 });
    }

    if (!booking) {
      return NextResponse.json(
        { error: "Booking request not found or unauthorized" },
        { status: 404 }
      );
    }

    // 2. Fetch requester user data
    const { data: requesterUser, error: requesterError } = await supabase
      .from("users")
      .select("user_avatar, userName, first_name, last_name, email")
      .eq("id", booking.requester_id)
      .single();

    if (requesterError) {
      console.error("Error fetching requester:", requesterError.message);
    }

    // 3. Fetch receiver user data
    const { data: receiverUser, error: receiverError } = await supabase
      .from("users")
      .select("user_avatar, userName, first_name, last_name, email")
      .eq("id", booking.receiver_id)
      .single();

    if (receiverError) {
      console.error("Error fetching receiver:", receiverError.message);
    }

    // 4. Update booking status to 'seen' when DJ (receiver) views it
    if (user.id === booking.receiver_id && booking.status !== 'seen') {
      const { error: updateError } = await supabase
        .from("booking_requests")
        .update({ 
          status: 'seen',
          updated_at: new Date().toISOString()
        })
        .eq("id", bookingId);

      if (updateError) {
        console.error("Error updating booking status:", updateError.message);
      } else {
        // Update local booking object
        booking.status = 'seen';
        booking.updated_at = new Date().toISOString();
      }
    }

    // 5. Merge data
    const mergedBooking = {
      ...booking,
      requester: requesterUser ? {
        id: booking.requester_id,
        user_avatar: requesterUser.user_avatar,
        userName: requesterUser.userName,
        first_name: requesterUser.first_name,
        last_name: requesterUser.last_name,
        email: requesterUser.email,
        full_name: `${requesterUser.first_name || ''} ${requesterUser.last_name || ''}`.trim()
      } : null,
      receiver: receiverUser ? {
        id: booking.receiver_id,
        user_avatar: receiverUser.user_avatar,
        userName: receiverUser.userName,
        first_name: receiverUser.first_name,
        last_name: receiverUser.last_name,
        email: receiverUser.email,
        full_name: `${receiverUser.first_name || ''} ${receiverUser.last_name || ''}`.trim()
      } : null
    };

    return NextResponse.json(
      { 
        booking: mergedBooking,
        message: "Booking details fetched successfully" 
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ [BOOKING-DETAILS] GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
