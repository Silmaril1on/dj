import { NextResponse } from "next/server";
import { createSupabaseServerClient, getServerUser } from "@/app/lib/config/supabaseServer";
import { cookies } from "next/headers";

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";

    // ✅ OPTIMIZED: Fetch feedbacks with user data in ONE query using JOIN
    const { data: feedbacks, error: feedbacksError } = await supabase
      .from("feedbacks")
      .select(`
        *,
        users:user_id(
          id,
          email,
          user_avatar,
          userName
        )
      `)
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (feedbacksError) {
      console.error("Feedbacks query error:", feedbacksError);
      return NextResponse.json({ error: feedbacksError.message }, { status: 500 });
    }

    if (!feedbacks || feedbacks.length === 0) {
      return NextResponse.json({ feedbacks: [] });
    }

    // Transform the joined data into the expected format
    const mergedFeedbacks = feedbacks.map(feedback => {
      const { users, ...feedbackData } = feedback;
      return {
        ...feedbackData,
        reporter: users || null,
      };
    });

    return NextResponse.json({ feedbacks: mergedFeedbacks });
  } catch (err) {
    console.error("GET feedbacks error:", err);
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