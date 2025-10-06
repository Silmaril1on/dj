import { NextResponse } from "next/server";
import {
  createSupabaseServerClient,
  getServerUser,
} from "@/app/lib/config/supabaseServer";
import { cookies } from "next/headers";

export async function GET() {
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

    // 1️⃣ Fetch booking requests for this DJ (receiver)
    const { data: bookingRequests, error: bookingError } = await supabase
      .from("booking_requests")
      .select("id, requester_id, venue_name, created_at, status,  receiver_id")
      .eq("receiver_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (bookingError) {
      return NextResponse.json(
        { error: bookingError.message },
        { status: 400 }
      );
    }

    if (!bookingRequests?.length) {
      return NextResponse.json(
        { bookingRequests: [], message: "No booking requests found" },
        { status: 200 }
      );
    }

    // 2️⃣ Collect all requester IDs
    const requesterIds = bookingRequests.map((req) => req.requester_id);

    // 3️⃣ Fetch requester info (name, email, avatar)
    const { data: requesterUsers, error: userFetchError } = await supabase
      .from("users")
      .select("id, userName, email, first_name, last_name,  user_avatar")
      .in("id", requesterIds);

    if (userFetchError) {
      return NextResponse.json(
        { error: userFetchError.message },
        { status: 400 }
      );
    }

    // 4️⃣ Merge requester data into bookingRequests
    const mergedData = bookingRequests.map((req) => {
      const requester = requesterUsers.find((u) => u.id === req.requester_id);
      return {
        id: req.id,
        event_name: req.venue_name,
        created_at: req.created_at,
        requester: requester
          ? {
              id: requester.id,
                userName: requester.userName, 
                full_name: `${requester.first_name || ""} ${requester.last_name || ""}`.trim(),
              email: requester.email,
              avatar: requester.user_avatar || null,
            }
          : null,
      };
    });

    // 5️⃣ Return combined result
    return NextResponse.json(
      {
        bookingRequests: mergedData,
        message: "Booking requests fetched successfully",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ [BOOKING-REQUESTS] GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


export async function POST(req) {
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
        {
          success: false,
          error: "User not authenticated",
        },
        { status: 401 }
      );
    }

    const supabase = await createSupabaseServerClient(cookieStore);
    const body = await req.json();
    const { action, booking_id, status } = body;

    // Handle different POST actions
    if (action === "mark-all-read") {
      const { data, error } = await supabase
        .from("booking_requests")
        .update({ status: "opened" })
        .eq("receiver_id", user.id)
        .eq("status", "unopened")
        .select();

      if (error) {
        console.error("❌ [BOOKING-REQUESTS] Mark-all-read error:", error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json(
        {
          message: "All booking requests marked as opened successfully",
          updatedCount: data?.length || 0,
        },
        { status: 200 }
      );
    }

    // Handle status updates (accept/reject booking)
    if (action === "update-status" && booking_id && status) {
      const { data, error } = await supabase
        .from("booking_requests")
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq("id", booking_id)
        .eq("receiver_id", user.id) // Ensure user owns this booking request
        .select()
        .single();

      if (error) {
        console.error("❌ [BOOKING-REQUESTS] Update status error:", error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      if (!data) {
        return NextResponse.json(
          { error: "Booking request not found or unauthorized" },
          { status: 404 }
        );
      }

      // Send notification to the requester about the status update
      const statusMessage = status === "accepted" 
        ? `Your booking request for "${data.event_name}" has been accepted!`
        : `Your booking request for "${data.event_name}" has been declined.`;

      const { error: notificationError } = await supabase
        .from("notifications")
        .insert({
          user_id: data.requester_id,
          type: "booking",
          title: `Booking Request ${status === "accepted" ? "Accepted" : "Declined"}`,
          message: statusMessage,
          read: false,
          created_at: new Date().toISOString()
        });

      if (notificationError) {
        console.error("Failed to send status update notification:", notificationError.message);
      }

      return NextResponse.json(
        {
          message: `Booking request ${status} successfully`,
          data
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );

  } catch (err) {
    console.error("❌ [BOOKING-REQUESTS] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
