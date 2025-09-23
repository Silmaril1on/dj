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
    // Get the user's submitted_club_id
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("submitted_club_id")
      .eq("id", user.id)
      .single();

    if (userError || !userData || !userData.submitted_club_id) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    // Get the club details
    const { data: submittedClubs, error: clubError } = await supabase
      .from("clubs")
      .select(
        "id, name, country, city, capacity, club_image, status, created_at, description"
      )
      .eq("id", userData.submitted_club_id);

    if (clubError) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch submitted clubs",
          details: clubError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: submittedClubs || [],
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
