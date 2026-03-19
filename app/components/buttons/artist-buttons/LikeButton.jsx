"use client";
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectUser } from "@/app/features/userSlice";
import { setError } from "@/app/features/modalSlice";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import ActionButton from "@/app/components/buttons/ActionButton";
import { revalidateUserStatistics } from "@/app/lib/hooks/useUserStatistics";

const LikeButton = ({
  className,
  artist,
  onLikeChange,
  text,
  size = 20,
  type = "artist",
}) => {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const [isLiked, setIsLiked] = useState(artist?.isLiked || false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLiked(artist?.isLiked || false);
  }, [artist?.isLiked]);

  const endpoint =
    type === "event" ? "/api/events/event-likes" : "/api/artists/like";
  const idKey = type === "event" ? "eventId" : "artistId";

  const handleToggle = async () => {
    if (isLoading) return;
    const prev = isLiked;
    setIsLiked(!prev);
    setIsLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [idKey]: artist.id, userId: user?.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setIsLiked(data.isLiked ?? !prev);
        onLikeChange?.(data.isLiked, data.likesCount);
        if (type === "artist") {
          await revalidateUserStatistics();
        }
      } else {
        setIsLiked(prev);
        dispatch(
          setError({ message: `Failed to like ${type}`, type: "error" }),
        );
      }
    } catch {
      setIsLiked(prev);
      dispatch(setError({ message: `Failed to like ${type}`, type: "error" }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ActionButton
      icon={isLiked ? <FaHeart size={size} /> : <FaRegHeart size={size} />}
      text={text}
      onClick={handleToggle}
      loading={isLoading}
      active={isLiked}
      authMessage={`Please login to like this ${type}`}
      className={className}
    />
  );
};

export default LikeButton;
