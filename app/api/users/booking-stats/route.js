import { NextResponse } from "next/server";
import {
  createSupabaseServerClient,
  getServerUser,
} from "@/app/lib/config/supabaseServer";
import { cookies } from "next/headers";

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

    // Get all bookings where current user is the receiver (DJ) - only need response field
    const { data: bookings, error: bookingsError } = await supabase
      .from("booking_requests")
      .select("response")
      .eq("receiver_id", user.id);

    if (bookingsError) {
      console.error("Bookings fetch error:", bookingsError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch bookings" },
        { status: 500 }
      );
    }

    // Count by response status
    const confirmed = bookings.filter(b => b.response === "confirmed").length;
    const declined = bookings.filter(b => b.response === "declined").length;
    const pending = bookings.filter(b => b.response === null || b.response === "pending").length;
    const total = bookings.length;

    const stats = {
      total,
      confirmed,
      declined,
      pending
    };

    console.log("📊 Booking stats:", stats);

    return NextResponse.json({
      success: true,
      data: { stats }
    });

  } catch (error) {
    console.error("Booking stats error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}