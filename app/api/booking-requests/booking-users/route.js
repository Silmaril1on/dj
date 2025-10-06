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

    // 1. Fetch all booking requests where current user is the receiver (DJ)
    const { data: bookingRequests, error: bookingError } = await supabase
      .from("booking_requests")
      .select("id, requester_id, created_at, event_name")
      .eq("receiver_id", user.id)
      .order("created_at", { ascending: false });

    if (bookingError) {
      return NextResponse.json({ error: bookingError.message }, { status: 400 });
    }

    if (!bookingRequests?.length) {
      return NextResponse.json(
        { chatUsers: [], message: "No booking requests found" },
        { status: 200 }
      );
    }

    // 2. Get unique requester IDs (avoid duplicates if same user made multiple requests)
    const uniqueRequesterIds = [...new Set(bookingRequests.map(req => req.requester_id))];

    // 3. Fetch requester user data
    const { data: requesterUsers, error: userFetchError } = await supabase
      .from("users")
      .select("id, user_avatar, userName, first_name, last_name, email")
      .in("id", uniqueRequesterIds);

    if (userFetchError) {
      return NextResponse.json({ error: userFetchError.message }, { status: 400 });
    }

    // 4. Create chat users list - one entry per unique requester with their latest request
    const chatUsers = uniqueRequesterIds.map(requesterId => {
      // Find the latest booking request from this requester
      const latestRequest = bookingRequests
        .filter(req => req.requester_id === requesterId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

      // Find user data for this requester
      const requesterUser = requesterUsers.find(user => user.id === requesterId);

      return {
        id: latestRequest.id, // Use latest request ID for navigation
        requester_id: requesterId,
        event_name: latestRequest.event_name,
        created_at: latestRequest.created_at,
        requester: requesterUser ? {
          id: requesterUser.id,
          user_avatar: requesterUser.user_avatar,
          userName: requesterUser.userName,
          first_name: requesterUser.first_name,
          last_name: requesterUser.last_name,
          email: requesterUser.email,
          full_name: `${requesterUser.first_name || ''} ${requesterUser.last_name || ''}`.trim()
        } : null,
        // Count total requests from this user
        totalRequests: bookingRequests.filter(req => req.requester_id === requesterId).length
      };
    }).filter(chatUser => chatUser.requester); // Filter out users where we couldn't fetch user data

    // 5. Sort by latest interaction
    chatUsers.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return NextResponse.json(
      { 
        chatUsers,
        message: "Chat users fetched successfully" 
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ [BOOKING-USERS] GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
