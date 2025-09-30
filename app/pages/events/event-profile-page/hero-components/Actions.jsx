"use client"
import { useState } from "react";
import LikeButton from '@/app/components/buttons/LikeButton';
import Motion from '@/app/components/containers/Motion';
import SpanText from '@/app/components/ui/SpanText';
import { FaUsers } from 'react-icons/fa';

const Actions = ({ event }) => {
  const [likesCount, setLikesCount] = useState(event.likesCount || 0);
  const [isLiked, setIsLiked] = useState(event.userLiked || false);

  const handleLikeChange = (liked, newLikesCount) => {
    setIsLiked(liked);
    setLikesCount(newLikesCount);
  };

  return (
    <Motion animation="pop" className="center space-x-4">
      <SpanText
        icon={<FaUsers />}
        size="sm"
        text={`${likesCount} Interested`}
        className="ml-2 secondary pointer-events-none"
      />
      <LikeButton
        type="event"
        artist={{
          id: event.id,
          isLiked: isLiked,
          likesCount: likesCount,
        }}
        onLikeChange={handleLikeChange}
      />
    </Motion>
  );
};

export default Actions;