import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";

export async function GET(request) {
  try {
    // ✅ OPTIMIZED: Get pending artists with submitter data in ONE query using JOIN
    const { data: artists, error: artistsError } = await supabaseAdmin
      .from("artists")
      .select(`
        id,
        name,
        stage_name,
        status,
        created_at,
        artist_image,
        country,
        city,
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

    if (artistsError) {
      console.error("Artists query error:", artistsError);
      return NextResponse.json(
        { error: artistsError.message, details: artistsError },
        { status: 500 }
      );
    }

    if (!artists || artists.length === 0) {
      return NextResponse.json({ submissions: [] });
    }

    // Transform the joined data into the expected format
    const submissions = artists.map((artist) => ({
      id: artist.id,
      name: artist.name,
      stage_name: artist.stage_name,
      artist_image: artist.artist_image,
      country: artist.country,
      city: artist.city,
      created_at: artist.created_at,
      submitter: artist.users
        ? {
            id: artist.users.id,
            userName: artist.users.userName,
            email: artist.users.email,
            user_avatar: artist.users.user_avatar,
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
