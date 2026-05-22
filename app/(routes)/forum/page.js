import { getForumPosts } from "@/app/lib/services/forum/getForumPosts";
import Forum from "./Forum";

const ForumPage = async () => {
  let initialPosts = [];
  let initialHasMore = false;
  try {
    const result = await getForumPosts();
    initialPosts = result.posts || [];
    initialHasMore = result.hasMore || false;
  } catch (err) {
    console.error("[ForumPage] Failed to fetch posts:", err);
  }
  return <Forum initialPosts={initialPosts} initialHasMore={initialHasMore} />;
};

export default ForumPage;
