import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function POST() {
  try {
    const cookieStore = await cookies();

    // Create Supabase server client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
          set(name, value, options) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name, options) {
            cookieStore.set({ name, value: "", ...options });
          },
        },
      }
    );
    await supabase.auth.signOut();
    cookieStore.set("user_data", "", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
    });

    return NextResponse.json({
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("❌ [LOGOUT] Error:", error);
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}
