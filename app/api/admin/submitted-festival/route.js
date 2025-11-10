import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";

export async function GET(request) {
  try {
    const { data: festivals, error: festivalsError } = await supabaseAdmin
      .from("festivals")
      .select(`
        id,
        name,
        country,
        city,
        location,
        status,
        created_at,
        poster,
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

    if (festivalsError) {
      console.error("Festivals query error:", festivalsError);
      return NextResponse.json({ error: festivalsError.message, details: festivalsError }, { status: 500 });
    }

    if (!festivals || festivals.length === 0) {
      return NextResponse.json({ submissions: [] });
    }

    // Transform the joined data into the expected format
    const submissions = festivals.map((festival) => ({
      id: festival.id,
      name: festival.name,
      stage_name: festival.location, // Using location as stage_name equivalent for display
      artist_image: festival.poster, // Using poster for consistency
      country: festival.country,
      city: festival.city,
      description: festival.description,
      created_at: festival.created_at,
      submitter: festival.users
        ? {
            id: festival.users.id,
            userName: festival.users.userName,
            email: festival.users.email,
            user_avatar: festival.users.user_avatar,
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
    const { festivalId, action } = await request.json();
    if (!festivalId || !action) {
      return NextResponse.json(
        { error: "Festival ID and action are required" },
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
      .from("festivals")
      .update({ status: newStatus })
      .eq("id", festivalId);
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    return NextResponse.json({
      success: true,
      message: `Festival ${action}d successfully`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
