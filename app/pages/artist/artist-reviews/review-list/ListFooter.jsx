"use client";
import { AiOutlineLike, AiOutlineDislike, AiFillLike, AiFillDislike } from "react-icons/ai";
import { useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectUser } from "@/app/features/userSlice";
import { setError } from "@/app/features/modalSlice";
import Spinner from "@/app/components/ui/Spinner";

const ListFooter = ({ review, onUpdate }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isDislikeLoading, setIsDislikeLoading] = useState(false);
  const likes = review.likes || [];
  const dislikes = review.dislikes || [];
  const userId = user?.id;
  const userLiked = userId && likes.includes(userId);
  const userDisliked = userId && dislikes.includes(userId);

  const handleLikeDislike = useCallback(async (action) => {
    if (!userId) {
      dispatch(setError("Please log in to like/dislike reviews"));
      return;
    }
    if (isLikeLoading || isDislikeLoading) {
      return;
    }
    if (action === 'like') {
      setIsLikeLoading(true);
    } else {
      setIsDislikeLoading(true);
    }
    try {
      const response = await fetch('/api/artists/review/likes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewId: review.id,
          userId: userId,
          action: action
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        if (onUpdate && data.review) {
          onUpdate(data.review);
        }
      } else {
        console.error('API Error:', data.error);
        alert(data.error || 'Failed to update review');
      }
    } catch (error) {
      console.error('Network Error updating review:', error);
      alert('Network error occurred. Please try again.');
    } finally {
      if (action === 'like') {
        setIsLikeLoading(false);
      } else {
        setIsDislikeLoading(false);
      }
    }
  }, [userId, review.id, onUpdate, isLikeLoading, isDislikeLoading]);

  return (
    <div className="flex items-center justify-between pt-4">
      <div className="flex items-center gap-4 secondary px-1 *:cursor-pointer dark:*:text-gold/80 dark:*:hover:text-gold *:duration-200 *:text-xl *:flex *:items-center *:gap-1">
        <button
          onClick={() => handleLikeDislike('like')}
          disabled={isLikeLoading || isDislikeLoading}
          aria-label={userLiked ? "Remove like" : "Like review"}
        >
          {isLikeLoading ? (
            <Spinner size="sm" />
          ) : userLiked ? (
            <AiFillLike />
          ) : (
            <AiOutlineLike />
          )}
          <span className="text-sm font-medium">{likes.length}</span>
        </button>

        <button
          onClick={() => handleLikeDislike('dislike')}
          disabled={isLikeLoading || isDislikeLoading}
          aria-label={userDisliked ? "Remove dislike" : "Dislike review"}
        >
          {isDislikeLoading ? (
            <Spinner size="sm" />
          ) : userDisliked ? (
            <AiFillDislike />
          ) : (
            <AiOutlineDislike />
          )}
          <span className="text-sm font-medium">{dislikes.length}</span>
        </button>
      </div>

      <div className="text-stone-500 text-sm">
        Review ID: {review.id.slice(0, 8)}...
      </div>
    </div>
  );
};

export default ListFooter;