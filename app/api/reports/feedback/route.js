import { NextResponse } from "next/server";
import { createSupabaseServerClient, getServerUser } from "@/app/lib/config/supabaseServer";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";

    // Fetch all feedbacks
    const { data: feedbacks, error: feedbacksError } = await supabase
      .from("feedbacks")
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (feedbacksError) {
      return NextResponse.json({ error: feedbacksError.message }, { status: 500 });
    }
    if (!feedbacks || feedbacks.length === 0) {
      return NextResponse.json({ feedbacks: [] });
    }

    // Get unique user_ids
    const userIds = [...new Set(feedbacks.map(f => f.user_id).filter(Boolean))];

    // Fetch users
    let usersMap = {};
    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, email, user_avatar, userName")
        .in("id", userIds);

      if (usersError) {
        return NextResponse.json({ error: usersError.message }, { status: 500 });
      }
      usersMap = Object.fromEntries(users.map(u => [u.id, u]));
    }

    // Merge user data into each feedback
    const mergedFeedbacks = feedbacks.map(feedback => ({
      ...feedback,
      reporter: usersMap[feedback.user_id] || null,
    }));

    return NextResponse.json({ feedbacks: mergedFeedbacks });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const cookieStore = await  cookies();
    const { user, error: userError } = await getServerUser(cookieStore);

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const supabase = await createSupabaseServerClient(cookieStore);
    const body = await request.json();
    const { title, content, rating } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const { error } = await supabase
      .from("feedbacks")
      .insert([{ title, content, rating, user_id: user.id }]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
      const cookieStore = await cookies();
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const supabase = await createSupabaseServerClient(cookieStore);
    const { error } = await supabase
      .from("feedbacks")
      .update({ status: "approved" })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}