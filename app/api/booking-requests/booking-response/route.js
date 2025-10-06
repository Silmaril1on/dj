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
        { success: false, error: "User not authenticated" },
        { status: 401 }
      );
    }

    const supabase = await createSupabaseServerClient(cookieStore);
    const body = await request.json();
    
    const { 
      title, 
      content, 
      requester_id,
      booking_request_id 
    } = body;

    // Validate required fields
    if (!title || !requester_id || !booking_request_id) {
      return NextResponse.json(
        { error: "Missing required fields: title, requester_id, booking_request_id" }, 
        { status: 400 }
      );
    }

    // 1. Verify that the current user is the receiver of this booking request AND get artist_id
    const { data: bookingRequest, error: bookingError } = await supabase
      .from("booking_requests")
      .select("id, receiver_id, requester_id, event_name, artist_id") 
      .eq("id", booking_request_id)
      .eq("receiver_id", user.id) 
      .single();

    if (bookingError || !bookingRequest) {
      return NextResponse.json(
        { error: "Booking request not found or unauthorized" },
        { status: 404 }
      );
    }

    if (bookingRequest.requester_id !== requester_id) {
      return NextResponse.json(
        { error: "Requester ID mismatch" },
        { status: 400 }
      );
    }

    // 1.5. Fetch artist name and stage_name for professional notification
    const { data: artistData, error: artistError } = await supabase
      .from("artists")
      .select("name, stage_name")
      .eq("id", bookingRequest.artist_id)
      .single();

    if (artistError) {
      console.error("Failed to fetch artist data:", artistError.message);
    }

    const artistDisplayName = artistData ? 
      (artistData.stage_name || artistData.name || "The DJ") : 
      "The DJ";

    // 2. Insert booking response
    const { data: response, error: responseError } = await supabase
      .from("booking_response")
      .insert({
        title,
        content: content || null,
        responser_id: user.id, 
        requester_id: requester_id,
      })
      .select()
      .single();

    if (responseError) {
      return NextResponse.json(
        { error: `Failed to create booking response: ${responseError.message}` },
        { status: 500 }
      );
    }

    // 3. Update booking request response to 'pending'
    const { error: updateError } = await supabase
      .from("booking_requests")
      .update({ 
        response: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq("id", booking_request_id);

    if (updateError) {
      console.error("Failed to update booking request status:", updateError.message);
      // Don't fail the entire request if status update fails
    }

    // 4. Send professional notification to the requester
    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        user_id: requester_id,
        type: "booking",
        title: "Booking Response Received",
        message: `${artistDisplayName} has responded to your booking request for "${bookingRequest.event_name}". Check your booking requests for details and next steps.`,
        read: false,
        created_at: new Date().toISOString()
      });

    if (notificationError) {
      console.error("Failed to send notification:", notificationError.message);
      // Don't fail the entire request if notification fails
    }
      
    // 5. send email to requester about the response (using a Supabase function)

    return NextResponse.json({
      success: true,
      message: "Booking response sent successfully",
      data: {
        response,
        booking_request_id,
        status: 'pending',
        artist_name: artistDisplayName
      }
    });

  } catch (err) {
    console.error("Booking response error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
