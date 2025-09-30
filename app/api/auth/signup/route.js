// api/auth/signup/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createSupabaseServerClient,
  supabaseAdmin,
} from "@/app/lib/config/supabaseServer";

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);
    const { email, password, userName } = await request.json();

    // Validate input
    if (!email || !password || !userName) {
      return NextResponse.json(
        { error: "Email, password, and username are required" },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // Basic password validation
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser, error: existingUserError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (existingUserError && existingUserError.code !== "PGRST116") {
      console.error("Error checking existing user:", existingUserError);
      return NextResponse.json(
        { error: "Failed to check if user exists" },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Create user with regular client (this will send confirmation email if enabled)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        data: {
          userName: userName.trim(),
          display_name: userName.trim(),
        },
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    // Insert into users table using admin client (to bypass RLS if needed)
    const { data: userData, error: insertError } = await supabaseAdmin
      .from("users")
      .insert({
        id: authData.user.id,
        email: email.toLowerCase().trim(),
        userName: userName.trim(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating user profile:", insertError);
      // Cleanup: delete the auth user if profile creation failed
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      } catch (cleanupError) {
        console.error("Error cleaning up auth user:", cleanupError);
      }
      return NextResponse.json(
        { error: "Failed to create user profile" },
        { status: 500 }
      );
    }

    // Create welcome notification directly (non-blocking)
    supabaseAdmin
      .from("notifications")
      .insert({
        user_id: userData.id,
        userName: userData.userName,
        email: userData.email,
        message:
          "Welcome to the platform. You can now login to your account and start using the platform.",
      })
      .then(({ error }) => {
        if (error) {
          console.warn("Failed to create welcome notification:", error);
        }
      });

    // If email confirmation is disabled, user will be automatically signed in
    // If email confirmation is enabled, user needs to confirm email first
    const message = authData.session
      ? "Account created and logged in successfully!"
      : "Account created successfully! Please check your email to confirm your account.";

    return NextResponse.json({
      user: authData.session ? userData : null,
      message,
      needsEmailConfirmation: !authData.session,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
