import { NextResponse } from "next/server";
import {
  createSupabaseServerClient,
  getServerUser,
} from "@/app/lib/config/supabaseServer";
import { cookies } from "next/headers";

// GET: Fetch chat messages for a specific booking
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

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("booking_id");

    if (!bookingId) {
      return NextResponse.json(
        { error: "booking_id is required" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient(cookieStore);

    // 1. Verify user has access to this booking - with better error logging
    const { data: booking, error: bookingError } = await supabase
      .from("booking_requests")
      .select("id, requester_id, receiver_id")
      .eq("id", bookingId)
      .single();

    if (bookingError) {
      console.error("Booking fetch error:", bookingError);
      return NextResponse.json(
        {
          error: "Booking not found",
          details: bookingError.message,
        },
        { status: 404 }
      );
    }

    if (!booking) {
      return NextResponse.json(
        {
          error: "Booking not found",
        },
        { status: 404 }
      );
    }

    // Check if user is either requester or receiver
    const isRequester = user.id === booking.requester_id;
    const isReceiver = user.id === booking.receiver_id;

    if (!isRequester && !isReceiver) {
      return NextResponse.json(
        {
          error: "Access denied",
          debug: {
            userId: user.id,
            requesterId: booking.requester_id,
            receiverId: booking.receiver_id,
          },
        },
        { status: 403 }
      );
    }

    // 2. Fetch ALL chat messages for this booking_id
    const { data: messages, error: messagesError } = await supabase
      .from("booking_chat")
      .select("id, message, sender_id, booking_id, created_at")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: true });

    if (messagesError) {
      return NextResponse.json(
        { error: "Failed to fetch messages" },
        { status: 500 }
      );
    }

    // 3. Get unique sender IDs from messages
    const senderIds = [...new Set(messages?.map((msg) => msg.sender_id) || [])];

    if (senderIds.length === 0) {
      return NextResponse.json({
        success: true,
        messages: [],
      });
    }

    // 4. Fetch user data for all senders
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, userName, user_avatar")
      .in("id", senderIds);

    if (usersError) {
      return NextResponse.json(
        { error: "Failed to fetch user data" },
        { status: 500 }
      );
    }

    // 5. Create user lookup map
    const userMap = (users || []).reduce((acc, user) => {
      acc[user.id] = {
        id: user.id,
        userName: user.userName,
        user_avatar: user.user_avatar,
      };
      return acc;
    }, {});

    // 6. Combine messages with user data
    const messagesWithUsers = (messages || []).map((message) => ({
      id: message.id,
      message: message.message,
      sender_id: message.sender_id,
      booking_id: message.booking_id,
      created_at: message.created_at,
      sender: userMap[message.sender_id] || {
        id: message.sender_id,
        userName: "Unknown User",
        user_avatar: null,
      },
    }));

    return NextResponse.json({
      success: true,
      messages: messagesWithUsers,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error", details: err.message },
      { status: 500 }
    );
  }
}

// POST: Send a new chat message
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

    const supabase = await createSupabaseServerClient(cookieStore);
    const body = await request.json();

    const { message, booking_id } = body;

    // Validate required fields
    if (!message || !booking_id) {
      return NextResponse.json(
        { error: "Missing required fields: message, booking_id" },
        { status: 400 }
      );
    }

    // 1. Verify user has access to this booking
    const { data: booking, error: bookingError } = await supabase
      .from("booking_requests")
      .select("id, requester_id, receiver_id")
      .eq("id", booking_id)
      .single();

    if (bookingError) {
      return NextResponse.json(
        {
          error: "Booking not found",
          details: bookingError.message,
        },
        { status: 404 }
      );
    }

    if (!booking) {
      return NextResponse.json(
        {
          error: "Booking not found",
        },
        { status: 404 }
      );
    }

    // Check if user is either requester or receiver
    const isRequester = user.id === booking.requester_id;
    const isReceiver = user.id === booking.receiver_id;

    if (!isRequester && !isReceiver) {
      return NextResponse.json(
        {
          error: "Access denied",
          debug: {
            userId: user.id,
            requesterId: booking.requester_id,
            receiverId: booking.receiver_id,
          },
        },
        { status: 403 }
      );
    }

    // 2. Insert new chat message
    const { data: chatMessage, error: messageError } = await supabase
      .from("booking_chat")
      .insert({
        message: message.trim(),
        sender_id: user.id,
        booking_id: booking_id,
        created_at: new Date().toISOString(),
      })
      .select("id, message, sender_id, booking_id, created_at")
      .single();

    if (messageError) {
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 }
      );
    }

    // 3. Get the sender's user data
    const { data: senderUser, error: senderError } = await supabase
      .from("users")
      .select("id, userName, user_avatar")
      .eq("id", user.id)
      .single();

    if (senderError) {
      console.error("Sender fetch error:", senderError);
    }

    // 4. Combine message with sender data
    const messageWithUser = {
      ...chatMessage,
      sender: senderUser || {
        id: user.id,
        userName: "Unknown User",
        user_avatar: null,
      },
    };

    // 5. Update booking request response to 'pending' if it's the first message from receiver
    if (isReceiver) {
      const { error: updateError } = await supabase
        .from("booking_requests")
        .update({
          response: "pending",
          updated_at: new Date().toISOString(),
        })
        .eq("id", booking_id);

      if (updateError) {
        console.error("Failed to update booking request status:", updateError);
      }
    }

    return NextResponse.json({
      success: true,
      data: messageWithUser,
    });
  } catch (err) {
    console.error("Chat send error:", err);
    return NextResponse.json(
      { error: "Internal server error", details: err.message },
      { status: 500 }
    );
  }
}
