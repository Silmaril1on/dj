import { NextResponse } from "next/server";
import { createSupabaseServerClient, getServerUser } from "@/app/lib/config/supabaseServer";
import { cookies } from "next/headers";

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const { user, error: userError } = await getServerUser(cookieStore);

    if (userError || !user) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient(cookieStore);
    const { currentPassword, newPassword } = await request.json();

    // Change password using Supabase Auth API
    const { error: pwError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (pwError) {
      return NextResponse.json({ error: pwError.message }, { status: 400 });
    }

    // Get IP address from headers
    const ip_address =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      request.headers.get("host") ||
      "";

    // Insert password change record
    await supabase.from("user_passwords").insert([{
      user_id: user.id,
      user_email: user.email,
      changed_by: "self",
      ip_address,
    }]);

    // Send notification
    await supabase.from("notifications").insert([{
      user_id: user.id,
      userName: user.user_metadata?.userName || user.email,
      email: user.email,
      message: "Your password was changed. If this wasn't you, please contact support immediately.",
    }]);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}