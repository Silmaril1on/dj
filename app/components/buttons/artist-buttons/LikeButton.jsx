"use client";
import { useSelector } from "react-redux";
import { selectUser } from "@/app/features/userSlice";
import ToggleActionButton from "./base/ToggleActionButton";
import { FaHeart, FaRegHeart } from "react-icons/fa";

const LikeButton = ({
  className,
  artist,
  onLikeChange,
  desc,
  type = "artist",
}) => {
  const user = useSelector(selectUser);

  const endpoint =
    type === "event" ? "/api/events/event-likes" : "/api/artists/like";
  const idKey = type === "event" ? "eventId" : "artistId";

  return (
    <ToggleActionButton
      initialState={artist?.isLiked || false}
      endpoint={endpoint}
      payload={{ [idKey]: artist.id, userId: user?.id }}
      icons={{
        active: <FaHeart size={17} />,
        inactive: <FaRegHeart size={17} />,
      }}
      label={desc}
      successMessage={{
        on: `${type === "event" ? "Event" : "Artist"} liked`,
        off: `${type === "event" ? "Event" : "Artist"} unliked`,
      }}
      errorMessage={`Failed to like ${type === "event" ? "event" : "artist"}`}
      onSuccess={(data) => {
        onLikeChange?.(data.isLiked, data.likesCount);
      }}
      authMessage={`Please login to like this ${type}`}
      className={className}
    />
  );
};

export default LikeButton;
