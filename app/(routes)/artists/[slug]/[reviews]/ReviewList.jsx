"use client";
import { useCallback, useMemo, useState } from "react";
import Paragraph from "@/app/components/ui/Paragraph";
import Title from "@/app/components/ui/Title";
import Motion from "@/app/components/containers/Motion";
import ProfilePicture from "@/app/components/materials/ProfilePicture";
import FlexBox from "@/app/components/containers/FlexBox";
import SpanText from "@/app/components/ui/SpanText";
import Dot from "@/app/components/ui/Dot";
import { FaStar } from "react-icons/fa";
import { capitalizeFirst, formatTime } from "@/app/helpers/utils";
import {
  AiOutlineLike,
  AiOutlineDislike,
  AiFillLike,
  AiFillDislike,
} from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import { selectUser } from "@/app/features/userSlice";
import { setError } from "@/app/features/modalSlice";
import Spinner from "@/app/components/ui/Spinner";

const ReviewList = ({ data, setReviews }) => {
  if (!data || data.length === 0) {
    return (
      <div className="center grow">
        <div className="text-center">
          <Title size="lg" text="No Reviews Yet" />
          <Paragraph text="Be the first to review this artist!" />
        </div>
      </div>
    );
  }

  const handleReviewUpdate = useCallback(
    (updatedReview) => {
      setReviews((prevReviews) =>
        prevReviews.map((review) =>
          review.id === updatedReview.id
            ? {
                ...updatedReview,
                userRating: updatedReview.userRating ?? review.userRating,
                users: updatedReview.users ?? review.users, // preserve users info
              }
            : review,
        ),
      );
    },
    [setReviews],
  );

  const reviewItems = useMemo(() => {
    return data?.map((review, index) => {
      const userScore = review.userRating || "No rating";
      return (
        <Motion
          animation="fade"
          key={review.id}
          className="bg-stone-800/50 p-4 bordered"
        >
          <ListHeader review={review} userScore={userScore} />
          <div className="bg-stone-900 rounded-sm p-3 lg:p-6 border border-stone-700/30">
            <Paragraph
              text={review.review_text}
              className="whitespace-pre-wrap"
            />
          </div>
          <ListFooter review={review} onUpdate={handleReviewUpdate} />
        </Motion>
      );
    });
  }, [data, handleReviewUpdate]);

  return <div className="space-y-3 flex grow flex-col">{reviewItems}</div>;
};

const ListHeader = ({ review, userScore }) => {
  return (
    <FlexBox type="row-between">
      <FlexBox className="gap-4">
        <ProfilePicture avatar_url={review.users?.user_avatar} />
        <div>
          <Title
            size="sm"
            color="chino"
            text={capitalizeFirst(review.review_title)}
          />
          <FlexBox className="gap-2" type="row-start">
            <SpanText size="xs" text={`by ${review.users?.userName}`} />
            <Dot />
            <SpanText size="xs" text={formatTime(review.created_at)} />
          </FlexBox>
        </div>
      </FlexBox>
      <div className="center gap-1">
        <FaStar className="dark:text-gold" />
        <SpanText size="md" text={`${userScore}/10`} />
      </div>
    </FlexBox>
  );
};

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

  const handleLikeDislike = useCallback(
    async (action) => {
      if (!userId) {
        dispatch(setError("Please log in to like/dislike reviews"));
        return;
      }
      if (isLikeLoading || isDislikeLoading) {
        return;
      }
      if (action === "like") {
        setIsLikeLoading(true);
      } else {
        setIsDislikeLoading(true);
      }
      try {
        const response = await fetch("/api/artists/review/likes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reviewId: review.id,
            userId: userId,
            action: action,
          }),
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
          console.error("API Error:", data.error);
          alert(data.error || "Failed to update review");
        }
      } catch (error) {
        console.error("Network Error updating review:", error);
        alert("Network error occurred. Please try again.");
      } finally {
        if (action === "like") {
          setIsLikeLoading(false);
        } else {
          setIsDislikeLoading(false);
        }
      }
    },
    [userId, review.id, onUpdate, isLikeLoading, isDislikeLoading, dispatch],
  );

  return (
    <div className="flex items-center justify-between pt-4">
      <div className="flex items-center gap-4 secondary px-1 *:cursor-pointer dark:*:text-gold/80 dark:*:hover:text-gold *:duration-200 *:text-xl *:flex *:items-center *:gap-1">
        <button
          onClick={() => handleLikeDislike("like")}
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
          onClick={() => handleLikeDislike("dislike")}
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

export default ReviewList;
