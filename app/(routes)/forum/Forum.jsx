"use client";
import { useState, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "@/app/features/userSlice";
import LayoutButtons from "@/app/components/buttons/LayoutButtons";
import RecommendationModal from "@/app/components/modals/RecommendationModal";
import ProfilePicture from "@/app/components/materials/ProfilePicture";
import Button from "@/app/components/buttons/Button";
import ErrorCode from "@/app/components/ui/ErrorCode";
import SectionContainer from "@/app/components/containers/SectionContainer";
import usePagination from "@/app/lib/hooks/usePagination";
import { capitalizeFirst, formatTime } from "@/app/helpers/utils";

const LIMIT = 30;

const TYPE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "artist", label: "Artists" },
  { value: "club", label: "Clubs" },
  { value: "festival", label: "Festivals" },
];

const TAG_COLOR = {
  artist: "violet-400",
  club: "pink-400",
  festival: "cyan-400",
};

const TYPE_BADGE = {
  artist: "text-violet-400 border-violet-400/30 bg-violet-400/10",
  club: "text-pink-400 border-pink-400/30 bg-pink-400/10",
  festival: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10",
};

const STATUS_BADGE = {
  pending: "text-orange-400 border-orange-400/30 bg-orange-400/10",
  added: "text-green-400 border-green-400/30 bg-green-400/10",
};

function renderContent(content, type) {
  const color = TAG_COLOR[type] ?? "text-gold";
  return content.split(/(#\w+)/g).map((part, i) =>
    part.startsWith("#") ? (
      <span key={i} className={`text-${color} font-bold`}>
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

const Forum = ({ initialPosts = [], initialHasMore = false }) => {
  const user = useSelector(selectUser);
  const isAdmin = user?.is_admin;

  const [activeType, setActiveType] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [markingIds, setMarkingIds] = useState(new Set());

  const { data, setData, loading, hasMore, loadMore } = usePagination({
    initialData: initialPosts,
    limit: LIMIT,
    initialHasMore,
    fetchPage: useCallback(async ({ limit, offset }) => {
      const res = await fetch(`/api/forum?limit=${limit}&offset=${offset}`, {
        cache: "no-store",
      });
      const json = await res.json();
      return { data: json.posts || [], hasMore: json.hasMore };
    }, []),
  });

  const filtered = useMemo(
    () =>
      activeType === "all" ? data : data.filter((p) => p.type === activeType),
    [data, activeType],
  );

  const handleSubmitted = (newPost) => {
    // Enrich optimistically with current user's profile
    const enriched = {
      ...newPost,
      user: user
        ? {
            id: user.id,
            userName: user.userName,
            user_avatar: user.user_avatar,
          }
        : null,
    };
    setData((prev) => [enriched, ...prev]);
  };

  const handleMarkDone = async (postId) => {
    setMarkingIds((prev) => new Set(prev).add(postId));
    try {
      const res = await fetch("/api/forum", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: postId }),
      });
      if (res.ok) {
        setData((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, status: "added" } : p)),
        );
      }
    } finally {
      setMarkingIds((prev) => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  };

  return (
    <SectionContainer
      title="Recommendations"
      description="Suggest artists, clubs or festivals to add to the database"
    >
      <div className="w-full space-y-6 min-h-screen">
        {/* Top bar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <LayoutButtons
            options={TYPE_OPTIONS}
            activeOption={activeType}
            onOptionChange={setActiveType}
            color="bg-black"
            layoutId="forumTypeLayout"
          />
          {user ? (
            <Button
              onClick={() => setModalOpen(true)}
              text="Add Recommendation"
            />
          ) : (
            <p className="text-stone-500 text-xs">Sign in to recommend</p>
          )}
        </div>

        {/* Post list */}
        {filtered.length === 0 ? (
          <ErrorCode
            title="No recommendations yet"
            description="Be the first to add a recommendation!"
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((post) => (
              <div
                key={post.id}
                className="border border-gold/10 bg-stone-900 p-3 space-y-3 relative"
              >
                {/* User + meta row */}
                <div className="flex items-center justify-between gap-2 flex-wrap ">
                  <div className="flex items-start gap-2">
                    <ProfilePicture
                      type="icon"
                      avatar_url={post.user?.user_avatar ?? null}
                    />
                    <div className="flex flex-col leading-none">
                      <span className="text-cream text-sm font-bold">
                        {post.user?.userName}
                      </span>
                      <span className="text-chino secondary text-[10px]">
                        {formatTime(post.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold uppercase border ${TYPE_BADGE[post.type] ?? ""}`}
                    >
                      {post.type}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold uppercase border ${STATUS_BADGE[post.status] ?? ""}`}
                    >
                      {post.status}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <p className="text-chino text-sm leading-relaxed secondary">
                  {renderContent(post.content, post.type)}
                </p>

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {post.tags.map((tag, i) => (
                      <span
                        key={i}
                        className={`text-xs border px-3 py-0.5 font-semibold  text-${TAG_COLOR[post.type] ?? "text-gold"}`}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Admin: mark as done */}
                {isAdmin && post.status !== "added" && (
                  <div className="flex justify-end absolute bottom-3 right-3">
                    <Button
                      type="success"
                      text="Done"
                      size="small"
                      onClick={() => handleMarkDone(post.id)}
                      loading={markingIds.has(post.id)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Load more */}
        {hasMore && (
          <div className="flex justify-center pt-2">
            <Button
              text={loading ? "Loading..." : "Load More"}
              onClick={loadMore}
              loading={loading}
            />
          </div>
        )}
      </div>

      <RecommendationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmitted={handleSubmitted}
      />
    </SectionContainer>
  );
};

export default Forum;
