import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";

// GET /api/reservation/restaurants - Fetch all restaurants
export async function GET() {
  try {
    const { data: restaurants, error } = await supabaseAdmin
      .from("restaurants")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching restaurants:", error);
      return NextResponse.json(
        { error: "Failed to fetch restaurants" },
        { status: 500 }
      );
    }

    return NextResponse.json({ restaurants }, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/reservation/restaurants:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
