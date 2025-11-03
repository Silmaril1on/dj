// api/auth/google-callback/route.js
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
    
    // Get the current authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Check if user already exists in users table
    const { data: existingUser, error: selectError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (selectError) {
      console.error("Error checking existing user:", selectError);
      return NextResponse.json(
        { error: "Failed to check user profile" },
        { status: 500 }
      );
    }

    // If user doesn't exist, create profile
    if (!existingUser) {
      const { email, user_metadata } = user;
      const { full_name, name, avatar_url, picture, userName, display_name } =
        user_metadata || {};

      const profile = {
        id: user.id,
        email: email.toLowerCase().trim(),
        userName: userName || display_name || full_name || name || email.split("@")[0],
        user_avatar: avatar_url || picture || "",
      };

      const { data: insertedUser, error: insertError } = await supabaseAdmin
        .from("users")
        .insert([profile])
        .select()
        .single();

      if (insertError) {
        console.error("Error inserting user profile:", insertError);
        return NextResponse.json(
          { error: "Failed to create user profile" },
          { status: 500 }
        );
      }

      // Create welcome notification for new user
      await supabaseAdmin
        .from("notifications")
        .insert({
          user_id: insertedUser.id,
          type: "welcome",
          title: "Welcome to Soundfolio!",
          read: false,
          message:
            "Your account has been created successfully. You can now access your dashboard and start exploring all available features.",
        })
        .then(({ error }) => {
          if (error) {
            console.warn("Failed to create welcome notification:", error);
          }
        });

      return NextResponse.json({
        user: insertedUser,
        message: "User profile created successfully",
        isNewUser: true,
      });
    }

    // User already exists, return existing profile
    return NextResponse.json({
      user: existingUser,
      message: "User profile found",
      isNewUser: false,
    });
  } catch (error) {
    console.error("Google callback error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
