"use client";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "@/app/features/userSlice";
import { openRatingModal, selectUserRating } from "@/app/features/ratingSlice";
import { FaRegStar, FaStar } from "react-icons/fa6";
import ModalActionButton from "./base/ModalActionButton";

const RatingButton = ({ artist, ratingStats, userRating, desc, className }) => {
  const user = useSelector(selectUser);
  const reduxRating = useSelector(selectUserRating(artist.id));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentRating = reduxRating || userRating || 0;
  const hasUserRating = mounted && user && currentRating > 0;

  const icon = hasUserRating ? (
    <>
      <FaStar size={18} />
      <span suppressHydrationWarning>{currentRating}</span>
    </>
  ) : (
    <FaRegStar size={18} />
  );

  return (
    <ModalActionButton
      modalType="rating"
      modalAction={openRatingModal}
      modalData={{
        artistId: artist.id,
        name: artist.name,
        stage_name: artist.stage_name,
        currentRating: currentRating,
        userRating: currentRating,
        averageScore: ratingStats?.average_score || 0,
        totalRatings: ratingStats?.total_ratings || 0,
      }}
      icon={icon}
      label={desc}
      authMessage="Please login to rate this artist"
      className={className}
    />
  );
};

export default RatingButton;
