import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/lib/config/supabaseServer";
import { cookies } from "next/headers";

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    // Fetch the news item
    const { data: news, error: newsError } = await supabase
      .from("news")
      .select("*")
      .eq("id", id)
      .single();

    if (newsError || !news) {
      return NextResponse.json(
        { error: newsError?.message || "News not found" },
        { status: 404 }
      );
    }

    // Fetch the user who submitted the news (if any)
    let user = null;
    if (news.user_id) {
      const { data: users, error: userError } = await supabase
        .from("users")
        .select("id, user_avatar, userName, email")
        .eq("id", news.user_id)
        .single();

      if (!userError && users) {
        user = users;
      }
    }

    return NextResponse.json({ news: { ...news, submitter: user } });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
