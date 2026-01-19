"use client";
import ModalActionButton from "./base/ModalActionButton";
import { openReviewModal } from "@/app/features/reviewsSlice";

const ReviewButton = ({ className, artist, desc, onReviewAdd }) => {
  // Store callback globally if needed
  if (onReviewAdd) {
    window.addNewReview = onReviewAdd;
  }

  return (
    <ModalActionButton
      modalType="review"
      modalAction={openReviewModal}
      modalData={{
        artistId: artist.id,
        name: artist.name,
        stage_name: artist.stage_name,
      }}
      label={desc}
      authMessage="Please login to review this artist"
      className={className}
    />
  );
};

export default ReviewButton;
