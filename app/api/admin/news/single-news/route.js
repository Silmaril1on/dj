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

    // ✅ OPTIMIZED: Fetch news with submitter data in ONE query using JOIN
    const { data: news, error: newsError } = await supabase
      .from("news")
      .select(`
        *,
        users:user_id(
          id,
          user_avatar,
          userName,
          email
        )
      `)
      .eq("id", id)
      .single();

    if (newsError || !news) {
      return NextResponse.json(
        { error: newsError?.message || "News not found" },
        { status: 404 }
      );
    }

    // Transform the joined data into the expected format
    const { users, ...newsData } = news;
    
    return NextResponse.json({ 
      news: { 
        ...newsData, 
        submitter: users || null 
      } 
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
