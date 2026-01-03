import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/lib/config/supabaseServer";
import { cookies } from "next/headers";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name");

    if (!name) {
      return NextResponse.json(
        { error: "Artist name is required" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);

    // Search artists by name or stage_name
    const { data: artists, error } = await supabase
      .from("artists")
      .select("id, name, stage_name, artist_image")
      .or(`name.ilike.%${name}%,stage_name.ilike.%${name}%`)
      .limit(10);

    if (error) {
      console.error("Error searching artists:", error);
      return NextResponse.json(
        { error: "Failed to search artists" },
        { status: 500 }
      );
    }

    return NextResponse.json({ artists });
  } catch (error) {
    console.error("Error in artist search:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
