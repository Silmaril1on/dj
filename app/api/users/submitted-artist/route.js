import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/app/lib/config/supabaseServer";

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not authenticated",
        },
        { status: 401 }
      );
    }
    // Get the user's submitted_artist_id
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("submitted_artist_id")
      .eq("id", user.id)
      .single();

    if (userError || !userData || !userData.submitted_artist_id) {
      console.log("No submitted_artist_id found for user:", user.id);
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    // Get the artist details
    const { data: submittedArtists, error: artistError } = await supabase
      .from("artists")
      .select(
        "id, name, stage_name, artist_image, status, created_at, city, country"
      )
      .eq("id", userData.submitted_artist_id);

    if (artistError) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch submitted artists",
          details: artistError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: submittedArtists || [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
