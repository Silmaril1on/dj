"use client";
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectReviewModal,
  closeReviewModal,
} from "@/app/features/reviewsSlice";
import { setError } from "@/app/features/modalSlice";
import { selectUser } from "@/app/features/userSlice";
import {
  closeRatingModal,
  updateUserRating,
  updateRatingStats,
} from "@/app/features/ratingSlice";
import Button from "../buttons/Button";
import Paragraph from "../ui/Paragraph";
import FlexBox from "../containers/FlexBox";
import GlobalModal from "./GlobalModal";

const ReviewModal = () => {
  const reviewModal = useSelector(selectReviewModal);
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (reviewModal.isEditMode) {
      setReviewTitle(reviewModal.editReviewTitle || "");
      setReviewText(reviewModal.editReviewText || "");
    } else {
      setReviewTitle("");
      setReviewText("");
    }
  }, [
    reviewModal.isEditMode,
    reviewModal.editReviewTitle,
    reviewModal.editReviewText,
  ]);

  const handleClose = () => {
    dispatch(closeReviewModal());
    if (reviewModal.isLowRating) {
      dispatch(closeRatingModal());
    }
    setReviewTitle("");
    setReviewText("");
    if (reviewModal.isEditMode) {
      window.updateReviewCallback = null;
    } else {
      window.addNewReview = null;
    }
  };

  const submitRatingForLowRating = async () => {
    try {
      const response = await fetch("/api/artists/rating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artistId: reviewModal.artistId,
          rating: reviewModal.rating,
          userId: user.id,
          username: user.userName || user.email,
        }),
      });
      if (response.ok) {
        const responseData = await response.json();
        dispatch(
          updateUserRating({
            artistId: reviewModal.artistId,
            rating: reviewModal.rating,
          }),
        );
        if (responseData.data?.rating_stats) {
          dispatch(
            updateRatingStats({
              artistId: reviewModal.artistId,
              average_score: responseData.data.rating_stats.average_score,
              total_ratings: responseData.data.total_ratings,
            }),
          );
        }
      }
    } catch (error) {
      console.error("Error submitting rating for low rating:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reviewTitle.trim() || !reviewText.trim()) {
      dispatch(setError("Please fill in both title and review text"));
      return;
    }
    setIsSubmitting(true);
    try {
      let response;

      if (reviewModal.isEditMode) {
        response = await fetch("/api/users/user-reviews", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reviewId: reviewModal.editReviewId,
            reviewTitle: reviewTitle.trim(),
            reviewText: reviewText.trim(),
          }),
        });
      } else {
        response = await fetch("/api/artists/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            artistId: reviewModal.artistId,
            userId: user.id,
            reviewTitle: reviewTitle.trim(),
            reviewText: reviewText.trim(),
          }),
        });
      }

      if (response.ok) {
        const responseData = await response.json();

        if (reviewModal.isEditMode) {
          if (window.updateReviewCallback && responseData.review) {
            window.updateReviewCallback(responseData.review);
          }
          dispatch(
            setError({
              message: "Review updated successfully!",
              type: "success",
            }),
          );
        } else {
          if (window.addNewReview && responseData.review) {
            window.addNewReview(responseData.review);
          }
          if (reviewModal.isLowRating && reviewModal.rating) {
            await submitRatingForLowRating();
          }
          dispatch(
            setError({
              message: "Review submitted successfully!",
              type: "success",
            }),
          );
        }
        handleClose();
      } else {
        const errorData = await response.json();
        dispatch(
          setError(
            errorData.error ||
              `Failed to ${reviewModal.isEditMode ? "update" : "submit"} review`,
          ),
        );
      }
    } catch (error) {
      dispatch(
        setError(
          `Failed to ${reviewModal.isEditMode ? "update" : "submit"} review`,
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const artistName = reviewModal.stage_name || reviewModal.name;
  const submitLabel = reviewModal.isEditMode
    ? "Update Review"
    : "Submit Review";

  return (
    <GlobalModal
      isOpen={reviewModal.isOpen}
      onClose={handleClose}
      title={artistName}
      maxWidth="w-xl"
      onSubmit={handleSubmit}
      submitText={
        isSubmitting
          ? reviewModal.isEditMode
            ? "Updating..."
            : "Submitting..."
          : submitLabel
      }
      loading={isSubmitting}
    >
      {reviewModal.isLowRating && (
        <div className="bg-red-900/30 border border-red-700 p-4">
          <h1 className="text-crimson font-bold text-lg">
            Please Explain Your Low Rating
          </h1>
          <p className="text-red-300 text-xs secondary break-words">
            You rated this artist {reviewModal.rating}/10. To avoid spams,
            please provide constructive feedback explaining why you gave this
            low rating.
          </p>
        </div>
      )}
      <FlexBox type="column-center" className="items-center my-5">
        <Paragraph
          text={`Share your thoughts about ${artistName}`}
          className="text-center break-words"
        />
      </FlexBox>
      <div className="space-y-4">
        <div>
          <label htmlFor="reviewTitle">Review Title</label>
          <input
            type="text"
            id="reviewTitle"
            value={reviewTitle}
            onChange={(e) => setReviewTitle(e.target.value)}
            placeholder="Enter a title for your review"
            maxLength={100}
            required
          />
        </div>
        <div>
          <label htmlFor="reviewText">Review Text</label>
          <textarea
            id="reviewText"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            rows={6}
            placeholder="Write your detailed review here..."
            maxLength={1000}
            required
          />
          <div className="text-right text-xs text-gray-500 mt-1">
            {reviewText.length}/1000
          </div>
        </div>
      </div>
    </GlobalModal>
  );
};

export default ReviewModal;
