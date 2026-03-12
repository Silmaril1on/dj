"use client";
import { useState } from "react";
import Motion from "@/app/components/containers/Motion";
import SpanText from "@/app/components/ui/SpanText";
import { FaUsers } from "react-icons/fa";
import LikeButton from "@/app/components/buttons/artist-buttons/LikeButton";
import ReminderButton from "@/app/components/buttons/artist-buttons/ReminderButton";

const ProfileActions = ({ data, type }) => {
  const [likesCount, setLikesCount] = useState(data.likesCount || 0);
  const [isLiked, setIsLiked] = useState(data.userLiked || false);
  const [isReminderSet, setIsReminderSet] = useState(
    data.userReminderSet || false,
  );
  const [reminderOffsetDays, setReminderOffsetDays] = useState(
    data.userReminderOffsetDays || 3,
  );

  const handleLikeChange = (liked, newLikesCount) => {
    setIsLiked(liked);
    setLikesCount(newLikesCount);
  };

  const getInterestLabel = () => {
    switch (type) {
      case "event":
        return "Interested";
      case "clubs":
        return "Likes";
      case "festivals":
        return "Going";
      default:
        return "Likes";
    }
  };

  return (
    <Motion
      animation="pop"
      className={`pl-2 lg:px-4 ${type === "event" ? "space-y-2" : "center space-x-4"}`}
    >
      <div className="center space-x-4">
        <SpanText
          icon={<FaUsers size={15} />}
          size="xs"
          text={`${likesCount} ${getInterestLabel()}`}
          className="ml-2 secondary pointer-events-none"
        />
        <LikeButton
          type={type}
          artist={{
            id: data.id,
            isLiked: isLiked,
            likesCount: likesCount,
          }}
          onLikeChange={handleLikeChange}
        />
      </div>

      {type === "event" && (
        <div className="flex justify-end space-x-4">
          <SpanText
            text="Set reminder"
            size="xs"
            className="secondary pointer-events-none"
          />
          <ReminderButton
            event={{
              id: data.id,
              isReminderSet,
              reminderOffsetDays,
            }}
            onReminderChange={(nextState, nextOffset) => {
              setIsReminderSet(nextState);
              if (nextOffset) setReminderOffsetDays(nextOffset);
            }}
          />
        </div>
      )}
    </Motion>
  );
};

export default ProfileActions;
