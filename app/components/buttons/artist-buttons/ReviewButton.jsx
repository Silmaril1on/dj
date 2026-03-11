"use client";
import { useEffect } from "react";
import ModalActionButton from "./base/ModalActionButton";
import { openReviewModal } from "@/app/features/reviewsSlice";

const ReviewButton = ({ className, artist, desc, onReviewAdd }) => {
  useEffect(() => {
    if (onReviewAdd) {
      window.addNewReview = onReviewAdd;
    }

    return () => {
      if (window.addNewReview === onReviewAdd) {
        delete window.addNewReview;
      }
    };
  }, [onReviewAdd]);

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
