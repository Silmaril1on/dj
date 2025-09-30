import { NextResponse } from "next/server";
import { createSupabaseServerClient, getServerUser, supabaseAdmin } from "@/app/lib/config/supabaseServer";
import { cookies } from "next/headers";

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const { user, error: userError } = await getServerUser(cookieStore);

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
      }
      
    const supabase = await createSupabaseServerClient(cookieStore);
    const body = await request.json();
      const { title, content } = body;
      
    if (!title || !content) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const { error } = await supabase
      .from("reports")
      .insert([
        {
          title,
          content,
          user_id: user.id,
          user_email: user.email,
        },
      ]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
      }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    // 1. Fetch all reports
    const { data: reports, error: reportsError } = await supabaseAdmin
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (reportsError) {
      return NextResponse.json({ error: reportsError.message }, { status: 500 });
    }
    if (!reports || reports.length === 0) {
      return NextResponse.json({ reports: [] });
    }

    // 2. Get unique user_ids
    const userIds = [...new Set(reports.map(r => r.user_id).filter(Boolean))];

    // 3. Fetch users
    let usersMap = {};
    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabaseAdmin
        .from("users")
        .select("id, email, user_avatar, userName")
        .in("id", userIds);

      if (usersError) {
        return NextResponse.json({ error: usersError.message }, { status: 500 });
      }
      usersMap = Object.fromEntries(users.map(u => [u.id, u]));
    }

    // 4. Merge
    const mergedReports = reports.map(report => ({
      ...report,
      reporter: usersMap[report.user_id] || null,
    }));

    return NextResponse.json({ reports: mergedReports });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}



export async function DELETE(request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const { error } = await supabaseAdmin.from("reports").delete().eq("id", id);

    if (error) {
      console.error("Supabase delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE route error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}