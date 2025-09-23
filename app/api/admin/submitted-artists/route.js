import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";

export async function GET(request) {
  try {
    // Get all pending artists
    const { data: artists, error: artistsError } = await supabaseAdmin
      .from("artists")
      .select(
        "id, name, stage_name, status, created_at, artist_image, country, city"
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (artistsError) {
      return NextResponse.json(
        { error: artistsError.message },
        { status: 500 }
      );
    }
    if (!artists || artists.length === 0) {
      return NextResponse.json({ submissions: [] });
    }
    // Get users who submitted these artists
    const artistIds = artists.map((artist) => artist.id);
    const { data: users, error: usersError } = await supabaseAdmin
      .from("users")
      .select(
        `
        id,
        userName,
        email,
        user_avatar,
        submitted_artist_id
      `
      )
      .in("submitted_artist_id", artistIds);

    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }
    // Create a map of artist_id to user data
    const userMap = {};
    users?.forEach((user) => {
      if (user.submitted_artist_id) {
        userMap[user.submitted_artist_id] = user;
      }
    });
    // Combine artist data with submitter information
    const submissions = artists.map((artist) => ({
      id: artist.id,
      name: artist.name,
      stage_name: artist.stage_name,
      artist_image: artist.artist_image,
      country: artist.country,
      city: artist.city,
      created_at: artist.created_at,
      submitter: userMap[artist.id]
        ? {
            id: userMap[artist.id].id,
            userName: userMap[artist.id].userName,
            email: userMap[artist.id].email,
            user_avatar: userMap[artist.id].user_avatar,
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
    const { artistId, action } = await request.json();
    if (!artistId || !action) {
      return NextResponse.json(
        { error: "Artist ID and action are required" },
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
      .from("artists")
      .update({ status: newStatus })
      .eq("id", artistId);
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    return NextResponse.json({
      success: true,
      message: `Artist ${action}d successfully`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
