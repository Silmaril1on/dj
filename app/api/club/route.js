import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/app/lib/config/supabaseServer";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "15", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);

    // Fetch clubs
    const { data: clubs, error } = await supabase
      .from("clubs")
      .select("id, name, country, city, club_image, capacity")
      .eq("status", "approved")
      .order("name", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: clubs });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}