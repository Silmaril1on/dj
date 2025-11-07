import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";

export async function GET(request) {
  try {
    // ✅ OPTIMIZED: Get pending clubs with submitter data in ONE query using JOIN
    const { data: clubs, error: clubsError } = await supabaseAdmin
      .from("clubs")
      .select(`
        id,
        name,
        country,
        city,
        capacity,
        status,
        created_at,
        club_image,
        description,
        user_id,
        users:user_id(
          id,
          userName,
          email,
          user_avatar
        )
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (clubsError) {
      console.error("Clubs query error:", clubsError);
      return NextResponse.json({ error: clubsError.message, details: clubsError }, { status: 500 });
    }

    if (!clubs || clubs.length === 0) {
      return NextResponse.json({ submissions: [] });
    }

    // Transform the joined data into the expected format
    const submissions = clubs.map((club) => ({
      id: club.id,
      name: club.name,
      stage_name: club.city, // Using city as stage_name equivalent for display
      artist_image: club.club_image, // Using club_image for consistency
      country: club.country,
      city: club.city,
      capacity: club.capacity,
      description: club.description,
      created_at: club.created_at,
      submitter: club.users
        ? {
            id: club.users.id,
            userName: club.users.userName,
            email: club.users.email,
            user_avatar: club.users.user_avatar,
          }
        : null,
    }));

    return NextResponse.json({ submissions });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const { clubId, action } = await request.json();
    if (!clubId || !action) {
      return NextResponse.json(
        { error: "Club ID and action are required" },
        { status: 400 }
      );
    }
    if (!["approve", "decline"].includes(action)) {
      return NextResponse.json(
        { error: "Action must be 'approve' or 'decline'" },
        { status: 400 }
      );
    }
    const newStatus = action === "approve" ? "approved" : "declined";
    const { error: updateError } = await supabaseAdmin
      .from("clubs")
      .update({ status: newStatus })
      .eq("id", clubId);
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    return NextResponse.json({
      success: true,
      message: `Club ${action}d successfully`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
