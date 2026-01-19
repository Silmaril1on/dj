import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";

// POST /api/reservation - Create a new reservation
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      restaurant_id,
      full_name,
      email,
      phone,
      reservation_date,
      reservation_time,
      guest_count,
      notes,
    } = body;

    // Validate required fields
    if (
      !restaurant_id ||
      !full_name ||
      !email ||
      !phone ||
      !reservation_date ||
      !reservation_time ||
      !guest_count
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate restaurant exists
    const { data: restaurant, error: restaurantError } = await supabaseAdmin
      .from("restaurants")
      .select("id")
      .eq("id", restaurant_id)
      .single();

    if (restaurantError || !restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 }
      );
    }

    // Check if guest already exists
    let guestId;
    const { data: existingGuest, error: guestCheckError } = await supabaseAdmin
      .from("guests")
      .select("id")
      .eq("email", email)
      .eq("phone", phone)
      .single();

    if (existingGuest) {
      // Update existing guest
      guestId = existingGuest.id;
      const { error: updateError } = await supabaseAdmin
        .from("guests")
        .update({
          full_name,
          notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", guestId);

      if (updateError) {
        console.error("Error updating guest:", updateError);
      }
    } else {
      // Create new guest
      const { data: newGuest, error: guestError } = await supabaseAdmin
        .from("guests")
        .insert({
          full_name,
          email,
          phone,
          notes,
        })
        .select()
        .single();

      if (guestError) {
        console.error("Error creating guest:", guestError);
        return NextResponse.json(
          { error: "Failed to create guest record" },
          { status: 500 }
        );
      }

      guestId = newGuest.id;
    }

    // Generate unique reservation token
    const reservationToken = crypto.randomUUID();

    // Create reservation
    const { data: reservation, error: reservationError } = await supabaseAdmin
      .from("reservations")
      .insert({
        restaurant_id,
        guest_id: guestId,
        reservation_date,
        reservation_time,
        guest_count,
        status: "pending",
        reservation_token: reservationToken,
      })
      .select()
      .single();

    if (reservationError) {
      console.error("Error creating reservation:", reservationError);
      return NextResponse.json(
        { error: "Failed to create reservation" },
        { status: 500 }
      );
    }

    // Create notification for restaurant admin (not the guest)
    const { error: notificationError } = await supabaseAdmin
      .from("rest_notifications")
      .insert({
        reservation_id: reservation.id,
        type: "Table Reservation",
        recipient: `restaurant_${restaurant_id}`, // Can be updated when restaurant has email field
        title: "New Reservation Request",
        message: `New reservation request from ${full_name} for ${guest_count} guests on ${reservation_date} at ${reservation_time}. Contact: ${email}, ${phone}${notes ? `. Notes: ${notes}` : ""}`,
        status: "pending",
      });

    if (notificationError) {
      console.error("Error creating notification:", notificationError);
      // Don't fail the reservation if notification creation fails
    }

    return NextResponse.json(
      {
        message: "Reservation created successfully",
        reservation: {
          id: reservation.id,
          reservation_token: reservation.reservation_token,
          reservation_date: reservation.reservation_date,
          reservation_time: reservation.reservation_time,
          guest_count: reservation.guest_count,
          status: reservation.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/reservation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/reservation - Fetch reservations (optional - for admin or user view)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get("restaurant_id");
    const email = searchParams.get("email");

    let query = supabaseAdmin
      .from("reservations")
      .select(
        `
        *,
        restaurants(id, name, city, country),
        guests(id, full_name, email, phone)
      `
      )
      .order("created_at", { ascending: false });

    if (restaurantId) {
      query = query.eq("restaurant_id", restaurantId);
    }

    if (email) {
      // Need to join with guests table
      const { data: guest } = await supabaseAdmin
        .from("guests")
        .select("id")
        .eq("email", email)
        .single();

      if (guest) {
        query = query.eq("guest_id", guest.id);
      } else {
        return NextResponse.json({ reservations: [] }, { status: 200 });
      }
    }

    const { data: reservations, error } = await query;

    if (error) {
      console.error("Error fetching reservations:", error);
      return NextResponse.json(
        { error: "Failed to fetch reservations" },
        { status: 500 }
      );
    }

    return NextResponse.json({ reservations }, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/reservation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
