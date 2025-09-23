import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";

export async function GET(request) {
  try {
    // Get all pending clubs
    const { data: clubs, error: clubsError } = await supabaseAdmin
      .from("clubs")
      .select(
        "id, name, country, city, capacity, status, created_at, club_image, description"
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (clubsError) {
      return NextResponse.json({ error: clubsError.message }, { status: 500 });
    }
    if (!clubs || clubs.length === 0) {
      return NextResponse.json({ submissions: [] });
    }
    // Get users who submitted these clubs
    const clubIds = clubs.map((club) => club.id);
    const { data: users, error: usersError } = await supabaseAdmin
      .from("users")
      .select(
        `
        id,
        userName,
        email,
        user_avatar,
        submitted_club_id
      `
      )
      .in("submitted_club_id", clubIds);

    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }
    // Create a map of club_id to user data
    const userMap = {};
    users?.forEach((user) => {
      if (user.submitted_club_id) {
        userMap[user.submitted_club_id] = user;
      }
    });
    // Combine club data with submitter information
    const submissions = clubs.map((club) => ({
      id: club.id,
      name: club.name, // Using actual club name
      stage_name: club.city, // Using city as stage_name equivalent for display
      artist_image: club.club_image, // Using club_image as artist_image for consistency
      country: club.country,
      city: club.city,
      capacity: club.capacity,
      description: club.description,
      created_at: club.created_at,
      submitter: userMap[club.id]
        ? {
            id: userMap[club.id].id,
            userName: userMap[club.id].userName,
            email: userMap[club.id].email,
            user_avatar: userMap[club.id].user_avatar,
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
