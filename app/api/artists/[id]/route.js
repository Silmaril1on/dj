import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/app/lib/config/supabaseServer";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Artist ID is required" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);

    const { data: artist, error } = await supabase
      .from("artists")
      .select(
        `
        id,
        name,
        stage_name,
        country,
        city,
        sex,
        birth,
        desc,
        bio,
        genres,
        social_links,
        label,
        artist_image,
        status,
        created_at,
        updated_at
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching artist:", error);
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    if (!artist) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    return NextResponse.json(artist);
  } catch (error) {
    console.error("Error in GET artist API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);

    if (!id) {
      return NextResponse.json(
        { error: "Artist ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { type, ...eventData } = body;

    // Check if this is an artist date addition request
    if (type === "artist_date") {
      // Add artist date to artist_schedule table
      const { data: artistDate, error: artistDateError } = await supabase
        .from("artist_schedule")
        .insert({
          artist_id: id,
          ...eventData,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (artistDateError) {
        console.error("Error adding artist date:", artistDateError);
        return NextResponse.json(
          { error: "Failed to add artist date" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Artist date added successfully",
        data: artistDate,
      });
    }

    // For other update types, you can add logic here
    return NextResponse.json({ error: "Invalid update type" }, { status: 400 });
  } catch (error) {
    console.error("Error in PUT artist API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
