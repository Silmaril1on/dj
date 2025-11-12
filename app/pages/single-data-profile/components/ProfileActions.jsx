"use client";
import { useState } from "react";
import Motion from '@/app/components/containers/Motion';
import SpanText from '@/app/components/ui/SpanText';
import { FaUsers } from 'react-icons/fa';
import LikeButton from "@/app/components/buttons/artist-buttons/LikeButton";

const ProfileActions = ({ data, type }) => {
  const [likesCount, setLikesCount] = useState(data.likesCount || 0);
  const [isLiked, setIsLiked] = useState(data.userLiked || false);

  const handleLikeChange = (liked, newLikesCount) => {
    setIsLiked(liked);
    setLikesCount(newLikesCount);
  };

  const getInterestLabel = () => {
    switch (type) {
      case 'events':
        return 'Interested';
      case 'clubs':
        return 'Likes';
      case 'festivals':
        return 'Going';
      default:
        return 'Likes';
    }
  };

  return (
    <Motion animation="pop" className="center space-x-4 pl-2 lg:px-4">
      <SpanText
        icon={<FaUsers />}
        size="sm"
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
    </Motion>
  );
};

export default ProfileActions;
