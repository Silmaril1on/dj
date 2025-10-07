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

    // 1. Verify user has access to this booking
    const { data: booking, error: bookingError } = await supabase
      .from("booking_requests")
      .select("id, requester_id, receiver_id")
      .eq("id", bookingId)
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: "Booking not found or unauthorized" },
        { status: 404 }
      );
    }

    // 2. Fetch all chat messages for this booking (without complex relationships)
    const { data: messages, error: messagesError } = await supabase
      .from("booking_chat")
      .select("id, message, sender_id, requester_id, seen, created_at")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.error("Messages fetch error:", messagesError);
      return NextResponse.json(
        { error: `Failed to fetch messages: ${messagesError.message}` },
        { status: 500 }
      );
    }

    console.log("Raw messages from DB:", messages);

    if (!messages || messages.length === 0) {
      return NextResponse.json({
        success: true,
        messages: [],
        booking_id: bookingId
      });
    }

    // 3. Get unique user IDs from messages
    const userIds = [...new Set([
      ...messages.map(msg => msg.sender_id),
      ...messages.map(msg => msg.requester_id)
    ])].filter(Boolean);

    console.log("User IDs to fetch:", userIds);

    // 4. Fetch user data separately
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, userName, user_avatar, first_name, last_name")
      .in("id", userIds);

    if (usersError) {
      console.error("Users fetch error:", usersError);
    }

    console.log("Fetched users:", users);

    // 5. Create user lookup map
    const userMap = (users || []).reduce((acc, user) => {
      acc[user.id] = {
        id: user.id,
        userName: user.userName,
        user_avatar: user.user_avatar,
        first_name: user.first_name,
        last_name: user.last_name,
        display_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.userName
      };
      return acc;
    }, {});

    // 6. Format messages with user data
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      message: msg.message,
      sender_id: msg.sender_id,
      requester_id: msg.requester_id,
      seen: msg.seen,
      created_at: msg.created_at,
      sender: userMap[msg.sender_id] || {
        id: msg.sender_id,
        userName: 'Unknown User',
        user_avatar: null,
        display_name: 'Unknown User'
      },
      requester: userMap[msg.requester_id] || {
        id: msg.requester_id,
        userName: 'Unknown User',
        user_avatar: null,
        display_name: 'Unknown User'
      }
    }));

    console.log("Final formatted messages:", formattedMessages);

    return NextResponse.json({
      success: true,
      messages: formattedMessages,
      booking_id: bookingId
    });

  } catch (err) {
    console.error("Chat fetch error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
    
    const { 
      message,
      booking_id,
      requester_id
    } = body;

    console.log("Received chat message data:", body);

    // Validate required fields
    if (!message || !booking_id || !requester_id) {
      return NextResponse.json(
        { error: "Missing required fields: message, booking_id, requester_id" }, 
        { status: 400 }
      );
    }

    // 1. Verify user has access to this booking
    const { data: booking, error: bookingError } = await supabase
      .from("booking_requests")
      .select("id, requester_id, receiver_id")
      .eq("id", booking_id)
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .single();

    if (bookingError || !booking) {
      console.error("Booking verification error:", bookingError);
      return NextResponse.json(
        { error: "Booking not found or unauthorized" },
        { status: 404 }
      );
    }

    // 2. Insert new chat message
    const { data: chatMessage, error: messageError } = await supabase
      .from("booking_chat")
      .insert({
        message: message.trim(),
        sender_id: user.id,
        requester_id: requester_id,
        booking_id: booking_id,
        seen: false
      })
      .select("id, message, sender_id, requester_id, seen, created_at")
      .single();

    if (messageError) {
      console.error("Message insert error:", messageError);
      return NextResponse.json(
        { error: `Failed to send message: ${messageError.message}` },
        { status: 500 }
      );
    }

    console.log("Message inserted successfully:", chatMessage);

    // 3. Update booking request response to 'pending' if it's the first message from DJ
    if (user.id === booking.receiver_id) {
      const { error: updateError } = await supabase
        .from("booking_requests")
        .update({ 
          response: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq("id", booking_id);

      if (updateError) {
        console.error("Failed to update booking request status:", updateError.message);
      }
    }

    // 4. Get sender user data for response
    const { data: senderUser, error: senderError } = await supabase
      .from("users")
      .select("id, userName, user_avatar, first_name, last_name")
      .eq("id", user.id)
      .single();

    if (senderError) {
      console.error("Sender fetch error:", senderError);
    }

    // 5. Format response message
    const formattedMessage = {
      id: chatMessage.id,
      message: chatMessage.message,
      sender_id: chatMessage.sender_id,
      requester_id: chatMessage.requester_id,
      seen: chatMessage.seen,
      created_at: chatMessage.created_at,
      sender: senderUser ? {
        id: senderUser.id,
        userName: senderUser.userName,
        user_avatar: senderUser.user_avatar,
        first_name: senderUser.first_name,
        last_name: senderUser.last_name,
        display_name: `${senderUser.first_name || ''} ${senderUser.last_name || ''}`.trim() || senderUser.userName
      } : {
        id: user.id,
        userName: 'You',
        user_avatar: null,
        display_name: 'You'
      }
    };

    return NextResponse.json({
      success: true,
      message: "Message sent successfully",
      data: formattedMessage
    });

  } catch (err) {
    console.error("Chat send error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}