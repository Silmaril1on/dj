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
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const supabase = await createSupabaseServerClient(cookieStore);

    // Fetch booking requests where user is either receiver (DJ) or requester
    const { data: bookingRequests, error: bookingError } = await supabase
      .from("booking_requests")
      .select(`*`)
      .or(`receiver_id.eq.${user.id},requester_id.eq.${user.id}`)
      .order("updated_at", { ascending: false });

    if (bookingError) {
      console.error("Booking requests error:", bookingError);
      return NextResponse.json(
        { error: `Failed to fetch booking requests: ${bookingError.message}` },
        { status: 500 }
      );
    }


    if (!bookingRequests?.length) {
      return NextResponse.json({
        success: true,
        bookingRequests: [],
        message: "No booking requests found"
      });
    }

    // Separate requests by user role
    const receiverRequests = bookingRequests.filter(req => req.receiver_id === user.id);
    const requesterRequests = bookingRequests.filter(req => req.requester_id === user.id);

    let formattedRequests = [];

    // Handle receiver requests (DJ) - show requester data
    if (receiverRequests.length > 0) {
      const requesterIds = [...new Set(receiverRequests.map(req => req.requester_id))];
      
      const { data: requesterUsers, error: requesterError } = await supabase
        .from("users")
        .select("id, first_name, last_name, userName, user_avatar")
        .in("id", requesterIds);

      if (requesterError) {
        console.error("Failed to fetch requester data:", requesterError);
      } else {
        console.log("Fetched requester users:", requesterUsers);
      }

      const requesterMap = (requesterUsers || []).reduce((acc, userData) => {
        const fullName = `${userData.first_name || ''} ${userData.last_name || ''}`.trim();
        acc[userData.id] = {
          id: userData.id,
          avatar: userData.user_avatar,
          userName: userData.userName,
          full_name: fullName || userData.userName,
          email: userData.email || null
        };
        return acc;
      }, {});

      const receiverFormatted = receiverRequests.map(request => ({
        id: request.id,
        event_name: request.event_name,
        venue_name: request.venue_name,
        event_date: request.event_date,
        status: request.status,
        response: request.response,
        created_at: request.created_at,
        updated_at: request.updated_at,
        user_role: 'receiver',
        // For receiver, show requester data
        display_user: requesterMap[request.requester_id] || {
          id: request.requester_id,
          avatar: null,
          userName: 'Unknown User',
          full_name: 'Unknown User',
          email: null
        },
        requester_id: request.requester_id,
        receiver_id: request.receiver_id,
        artist_id: request.artist_id
      }));

      formattedRequests.push(...receiverFormatted);
    }

    // Handle requester requests - show artist data
    if (requesterRequests.length > 0) {
      const artistIds = [...new Set(requesterRequests.map(req => req.artist_id))];
      
      const { data: artistData, error: artistError } = await supabase
        .from("artists")
        .select("id, name, stage_name, artist_image")
        .in("id", artistIds);

      if (artistError) {
        console.error("Failed to fetch artist data:", artistError);
      } else {
        console.log("Fetched artist data:", artistData);
      }

      const artistMap = (artistData || []).reduce((acc, artist) => {
        acc[artist.id] = {
          id: artist.id,
          avatar: artist.artist_image,
          userName: artist.stage_name || artist.name,
          full_name: artist.name,
          email: null // Artists don't have email
        };
        return acc;
      }, {});

      const requesterFormatted = requesterRequests.map(request => ({
        id: request.id,
        event_name: request.event_name,
        venue_name: request.venue_name,
        event_date: request.event_date,
        status: request.status,
        response: request.response,
        created_at: request.created_at,
        updated_at: request.updated_at,
        user_role: 'requester',
        // For requester, show artist data
        display_user: artistMap[request.artist_id] || {
          id: request.artist_id,
          avatar: null,
          userName: 'Unknown Artist',
          full_name: 'Unknown Artist',
          email: null
        },
        requester_id: request.requester_id,
        receiver_id: request.receiver_id,
        artist_id: request.artist_id
      }));

      formattedRequests.push(...requesterFormatted);
    }

    // Add unread messages count (simplified for now)
    formattedRequests = formattedRequests.map(request => ({
      ...request,
      unread_messages: 0
    }));

    // Sort by updated_at descending
    formattedRequests.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    return NextResponse.json({
      success: true,
      bookingRequests: formattedRequests,
      message: "Booking requests fetched successfully"
    });

  } catch (err) {
    console.error("User requests fetch error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}