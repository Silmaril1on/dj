"use client";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectUser } from "@/app/features/userSlice";
import { openRatingModal, selectUserRating } from "@/app/features/ratingSlice";
import { FaRegStar, FaStar } from "react-icons/fa6";
import ActionButton from "@/app/components/buttons/ActionButton";

const RatingButton = ({ artist, ratingStats, userRating, text, className }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const reduxRating = useSelector(selectUserRating(artist.id));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentRating = reduxRating || userRating || 0;
  const hasUserRating = mounted && user && currentRating > 0;

  const handleClick = () => {
    dispatch(
      openRatingModal({
        artistId: artist.id,
        name: artist.name,
        stage_name: artist.stage_name,
        currentRating,
        userRating: currentRating,
        averageScore: ratingStats?.average_score || 0,
        totalRatings: ratingStats?.total_ratings || 0,
      }),
    );
  };

  return (
    <ActionButton
      icon={hasUserRating ? <FaStar size={18} /> : <FaRegStar size={18} />}
      text={text}
      onClick={handleClick}
      active={hasUserRating}
      authMessage="Please login to rate this artist"
      className={className}
    >
      {hasUserRating && <span suppressHydrationWarning>{currentRating}</span>}
    </ActionButton>
  );
};

export default RatingButton;
