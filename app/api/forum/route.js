import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerUser, supabaseAdmin } from "@/app/lib/config/supabaseServer";
import { revalidateTag } from "next/cache";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "30", 10),
      100,
    );
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    let query = supabaseAdmin
      .from("forum")
      .select("id, user_id, type, content, tags, status, created_at")
      .in("status", ["pending", "approved", "added"])
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (type && ["artist", "club", "festival"].includes(type)) {
      query = query.eq("type", type);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const posts = data || [];

    // Enrich with user data
    const userIds = [...new Set(posts.map((p) => p.user_id).filter(Boolean))];
    let usersMap = {};
    if (userIds.length > 0) {
      const { data: users } = await supabaseAdmin
        .from("users")
        .select("id, userName, user_avatar")
        .in("id", userIds);
      if (users) usersMap = Object.fromEntries(users.map((u) => [u.id, u]));
    }

    const enriched = posts.map((post) => ({
      ...post,
      user: usersMap[post.user_id] ?? null,
    }));

    return NextResponse.json({
      posts: enriched,
      hasMore: posts.length === limit,
    });
  } catch (err) {
    console.error("[forum GET]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const { user } = await getServerUser(cookieStore);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, content } = await request.json();

    if (!["artist", "club", "festival"].includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 },
      );
    }

    if (content.length > 500) {
      return NextResponse.json(
        { error: "Content is too long (max 500 characters)" },
        { status: 400 },
      );
    }

    // Extract tags — words prefixed with #
    const tags = [...content.matchAll(/#(\w+)/g)].map((m) => m[1]);

    const { data, error } = await supabaseAdmin
      .from("forum")
      .insert({
        user_id: user.id,
        type,
        content: content.trim(),
        tags,
        status: "pending",
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    revalidateTag("forum-posts");

    return NextResponse.json({ post: data }, { status: 201 });
  } catch (err) {
    console.error("[forum POST]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const cookieStore = await cookies();
    const { user } = await getServerUser(cookieStore);

    if (!user?.is_admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Post ID required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("forum")
      .update({ status: "added", updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw new Error(error.message);

    revalidateTag("forum-posts");

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[forum PATCH]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
