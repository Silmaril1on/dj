// api/auth/signin/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/app/lib/config/supabaseServer";

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Sign in user - Supabase will automatically handle cookies
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

    if (authError) {
      console.error("Auth error:", authError);
      return NextResponse.json({ error: authError.message }, { status: 401 });
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    // Get user data from users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    if (userError) {
      console.error("User fetch error:", userError);
      return NextResponse.json(
        { error: "Failed to fetch user profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      user: userData,
      message: "Signed in successfully",
    });
  } catch (error) {
    console.error("Signin error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
