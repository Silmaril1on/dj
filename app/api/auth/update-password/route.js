import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerUser, supabaseAdmin } from "@/app/lib/config/supabaseServer";

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const { user, error: userError } = await getServerUser(cookieStore);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { password } = await request.json();
    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        password: password,
      }
    );

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const ip_address =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const { error: logError } = await supabaseAdmin
      .from("user_passwords") // Try singular first
      .insert([
        {
          user_id: user.id,
          user_email: user.email,
          ip_address,
          changed_by: "self",
        },
      ]);

    if (logError) {
    } else {
      console.log("Password change logged successfully");
    }

    const { error: notificationError } = await supabaseAdmin
      .from("notifications")
      .insert([
        {
          user_id: user.id,
          message: "Your password has been successfully reset and updated.",
          read: false,
          title: "Password Updated",
          type: "security",
        },
      ]);

    if (notificationError) {
    } else {
      console.log("Notification sent successfully");
    }

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (err) {
    console.error("Password update error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
