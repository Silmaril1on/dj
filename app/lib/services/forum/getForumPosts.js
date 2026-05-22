import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";

const LIMIT = 30;

async function _getForumPosts() {
  const { data: posts, error } = await supabaseAdmin
    .from("forum")
    .select("id, user_id, type, content, tags, status, created_at")
    .in("status", ["pending", "approved", "added"])
    .order("created_at", { ascending: false })
    .range(0, LIMIT - 1);

  if (error) throw new Error(error.message);

  const items = posts || [];

  // Enrich with user data (userName + user_avatar)
  const userIds = [...new Set(items.map((p) => p.user_id).filter(Boolean))];
  let usersMap = {};
  if (userIds.length > 0) {
    const { data: users } = await supabaseAdmin
      .from("users")
      .select("id, userName, user_avatar")
      .in("id", userIds);
    if (users) usersMap = Object.fromEntries(users.map((u) => [u.id, u]));
  }

  return {
    posts: items.map((post) => ({
      ...post,
      user: usersMap[post.user_id] ?? null,
    })),
    hasMore: items.length === LIMIT,
  };
}

export const getForumPosts = unstable_cache(_getForumPosts, ["forum-posts"], {
  revalidate: 60,
  tags: ["forum-posts"],
});
