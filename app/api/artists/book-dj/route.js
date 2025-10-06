import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerUser, createSupabaseServerClient } from "@/app/lib/config/supabaseServer";

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const { user, error: userError } = await getServerUser(cookieStore);
    
    if (userError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient(cookieStore);
    const body = await request.json();
    
    const { 
      event_name, 
      venue_name, 
      event_date, 
      country, 
      city, 
      time, 
      lineup, 
      receiver_id, 
      address,
      location_url,
      artist_id 
    } = body;

    // Validate required fields
    if (!event_name || !venue_name || !event_date || !country || !city || !receiver_id) {
      return NextResponse.json(
        { error: "Missing required fields" }, 
        { status: 400 }
      );
    }

    // Prepare booking data
    const bookingData = {
      event_name,
      venue_name,
      event_date,
      address: address || null,
      location_url: location_url || null,
      country,
      city,
      time: time || null,
      lineup: lineup || null,
      status: "unopened",
      requester_id: user.id,
      receiver_id,
      artist_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Insert booking request
    const { data: booking, error: bookingError } = await supabase
      .from("booking_requests")
      .insert([bookingData])
      .select()
      .single();

    if (bookingError) {
      return NextResponse.json(
        { error: `Failed to create booking request: ${bookingError.message}` },
        { status: 500 }
      );
    }

    // Send notification to the requester (confirmation)
    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        user_id: user.id,
        type: "booking",
        title: "Booking Request",
        message: `Your booking request for "${event_name}" has been sent successfully. You will be notified when the DJ responds.`,
        read: false,
        created_at: new Date().toISOString()
      });

    if (notificationError) {
      console.error("Failed to send confirmation notification:", notificationError.message);
    }

    // here we should send an email to dj profile owner

    return NextResponse.json({
      success: true,
      message: "Booking request sent successfully",
      data: booking
    });

  } catch (err) {
    console.error("Booking request error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}