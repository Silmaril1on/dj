import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";

// PATCH /api/reservation/approve - Approve or reject a reservation
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { reservation_id, status, restaurant_id } = body;

    if (!reservation_id || !status) {
      return NextResponse.json(
        { error: "Reservation ID and status are required" },
        { status: 400 }
      );
    }

    const validStatuses = [
      "pending",
      "approved",
      "rejected",
      "completed",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error:
            "Invalid status. Must be: pending, approved, rejected, completed, or cancelled",
        },
        { status: 400 }
      );
    }

    // Verify reservation belongs to the restaurant
    if (restaurant_id) {
      const { data: reservation } = await supabaseAdmin
        .from("reservations")
        .select("restaurant_id")
        .eq("id", reservation_id)
        .single();

      if (!reservation || reservation.restaurant_id !== restaurant_id) {
        return NextResponse.json(
          { error: "Reservation not found or unauthorized" },
          { status: 404 }
        );
      }
    }

    // Update reservation status
    const { data: updatedReservation, error: updateError } = await supabaseAdmin
      .from("reservations")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reservation_id)
      .select(
        `
        *,
        guests(id, full_name, email, phone),
        restaurants(id, name, city, country)
      `
      )
      .single();

    if (updateError) {
      console.error("Error updating reservation:", updateError);
      return NextResponse.json(
        { error: "Failed to update reservation" },
        { status: 500 }
      );
    }

    // Create a notification for the guest (optional - to inform them of approval/rejection)
    if (status === "approved" || status === "rejected") {
      const statusMessage =
        status === "approved"
          ? "Your reservation has been approved! We look forward to seeing you."
          : "Unfortunately, your reservation request has been declined. Please try a different date or contact us directly.";

      await supabaseAdmin.from("rest_notifications").insert({
        reservation_id: reservation_id,
        type: "email",
        recipient: updatedReservation.guests.email,
        title: `Reservation ${status === "approved" ? "Approved" : "Declined"}`,
        message: `${statusMessage} Reservation Details: ${updatedReservation.guest_count} guests on ${updatedReservation.reservation_date} at ${updatedReservation.reservation_time} at ${updatedReservation.restaurants.name}.`,
        status: "pending",
      });
    }

    return NextResponse.json(
      {
        message: `Reservation ${status} successfully`,
        reservation: updatedReservation,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in PATCH /api/reservation/approve:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
