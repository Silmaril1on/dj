"use client";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { openBookingModal } from "@/app/features/bookingSlice";
import {
  openAddEventModal,
  openAddAlbumModal,
} from "@/app/features/modalSlice";
import { openReviewModal } from "@/app/features/reviewsSlice";
import { motion } from "framer-motion";
import { FaHouse } from "react-icons/fa6";
import { selectUser } from "@/app/features/userSlice";
import ActionButton from "@/app/components/buttons/ActionButton";
import RatingButton from "@/app/components/buttons/artist-buttons/RatingButton";
import LikeButton from "@/app/components/buttons/artist-buttons/LikeButton";

const Actions = ({ data, userRating, onLikeChange }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const userSubmittedArtistId = data.userSubmittedArtistId;
  const canManage =
    mounted && user && (user.is_admin || userSubmittedArtistId === data?.id);

  const shouldRenderBookButton =
    data?.user_id && user?.id && data.user_id !== user.id;

  const addReview = () => {
    dispatch(
      openReviewModal({
        artistId: data.id,
        name: data.name,
        stage_name: data.stage_name,
      }),
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 1.5 }}
      className="flex justify-end flex-wrap gap-2 xl:px-2"
    >
      {shouldRenderBookButton && (
        <ActionButton
          icon={<FaHouse size={18} />}
          text="Book"
          onClick={() => dispatch(openBookingModal(data))}
        />
      )}
      {canManage && (
        <ActionButton
          text="Add Date"
          onClick={() => dispatch(openAddEventModal({ artist: data }))}
          requirePermission={() => canManage}
          permissionMessage="You can only add events for your own artist profile"
          authMessage="Please login to add events"
        />
      )}
      {canManage && (
        <ActionButton
          text="Add Album"
          onClick={() => dispatch(openAddAlbumModal({ artist: data }))}
          requirePermission={() => canManage}
          permissionMessage="You can only add albums for your own artist profile"
          authMessage="Please login to add albums"
        />
      )}
      <RatingButton text="Rate" artist={data} userRating={userRating} />
      <LikeButton text="Like" artist={data} onLikeChange={onLikeChange} />
      <ActionButton
        text="Review"
        onClick={addReview}
        authMessage="Please login to review this artist"
      />
    </motion.div>
  );
};

export default Actions;
