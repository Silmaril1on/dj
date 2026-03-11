import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";

// GET - Find user by email
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 },
      );
    }

    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("id, email, userName, first_name, last_name")
      .eq("email", email)
      .single();

    if (error) {
      return NextResponse.json(
        { error: "User not found", user: null },
        { status: 404 },
      );
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (err) {
    console.error("❌ [USERS] GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
