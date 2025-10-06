import { NextResponse } from "next/server";
import {
  createSupabaseServerClient,
  getServerUser,
} from "@/app/lib/config/supabaseServer";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const { user, error: userError } = await getServerUser(cookieStore);

    if (userError) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication failed",
          details: userError.message,
        },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not authenticated",
        },
        { status: 401 }
      );
    }

    const supabase = await createSupabaseServerClient(cookieStore);

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { notifications: data, message: "Notifications fetched successfully" },
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ [NOTIFICATIONS] GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const { user, error: userError } = await getServerUser(cookieStore);

    if (userError) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication failed",
          details: userError.message,
        },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not authenticated",
        },
        { status: 401 }
      );
    }

    const supabase = await createSupabaseServerClient(cookieStore);
    const body = await req.json();
    const { action, message, user_id, title, type, email } = body;

    // Handle different POST actions
    if (action === "mark-all-read") {
      const { data, error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false)
        .select();

      if (error) {
        console.error("❌ [NOTIFICATIONS] Mark-all-read error:", error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json(
        {
          message: "All notifications marked as read successfully",
          updatedCount: data?.length || 0,
        },
        { status: 200 }
      );
    }

    // For creating notifications (admin only - use supabaseAdmin)
    if (!message) {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 }
      );
    }

    // This should be admin-only functionality, so we'll keep supabaseAdmin here
    const { supabaseAdmin } = await import("@/app/lib/config/supabaseServer");

    const { data, error } = await supabaseAdmin
      .from("notifications")
      .insert({
        user_id,
        title,
        type,
        message,
        read: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { notification: data, message: "Notification created" },
      { status: 201 }
    );
  } catch (err) {
    console.error("❌ [NOTIFICATIONS] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
