"use client";
import { useState, useEffect } from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { selectUser } from "@/app/features/userSlice";
import { setError } from "@/app/features/modalSlice";
import Spinner from "../../ui/Spinner";

const LikeButton = ({
  className,
  artist,
  onLikeChange,
  desc,
  type = "artist",
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const user = useSelector(selectUser);
  const dispatch = useDispatch();

  useEffect(() => {
    if (artist) {
      setIsLiked(artist.isLiked || false);
    }
  }, [artist]);

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      dispatch(
        setError({ message: "Please login to like this artist", type: "error" })
      );
      return;
    }
    if (isLoading) return;
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setIsLoading(true);
    try {
      const endpoint =
        type === "event" ? "/api/events/event-likes" : "/api/artists/like";
      const idPayloadKey = type === "event" ? "eventId" : "artistId";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [idPayloadKey]: artist.id, userId: user.id }),
      });
      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.isLiked);
        onLikeChange?.(data.isLiked, data.likesCount);
        dispatch(
          setError({
            message: data.isLiked
              ? `${type === "event" ? "Event" : "Artist"} liked`
              : `${type === "event" ? "Event" : "Artist"} disliked`,
            type: "success",
          })
        );
      } else {
        setIsLiked(!newLikedState);
        onLikeChange?.(!newLikedState, artist.likesCount);
        dispatch(
          setError({
            message: `Failed to like ${type === "event" ? "event" : "artist"}`,
            type: "error",
          })
        );
      }
    } catch (error) {
      setIsLiked(!newLikedState);
      onLikeChange?.(!newLikedState, artist.likesCount);
      dispatch(
        setError({
          message: `Failed to like ${type === "event" ? "event" : "artist"}`,
          type: "error",
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      onClick={handleLike}
      className={`bg-gold/30 hover:bg-gold/40 text-gold w-fit secondary center cursor-pointer duration-300 p-1 rounded-xs text-sm font-bold ${className}`}
    >
      {isLoading ? (
        <Spinner />
      ) : isLiked ? (
        <FaHeart size={19} />
      ) : (
        <FaRegHeart size={19} />
      )}
      {desc && <h1 className="pl-1">{desc}</h1>}
    </div>
  );
};

export default LikeButton;
