'use client'
import { BsThreeDots } from "react-icons/bs";
import { useState, useRef, useEffect } from "react";
import { useDispatch } from "react-redux";
import { openReviewModal } from "@/app/features/reviewsSlice";
import { setError, openGlobalModal } from "@/app/features/modalSlice";
import { FaTrash, FaEdit } from "react-icons/fa";
import Button from "@/app/components/buttons/Button";

const ReviewActions = ({ review, onDelete, onUpdate }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const popupRef = useRef(null);
  const dispatch = useDispatch();

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setShowPopup(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/users/review-stats/user-reviews?reviewId=${review.id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        dispatch(setError({ message: 'Review deleted successfully!', type: 'success' }));
        onDelete(review.id); // Remove from the list immediately
        setShowPopup(false);
      } else {
        const errorData = await response.json();
        dispatch(setError(errorData.error || 'Failed to delete review'));
      }
    } catch (error) {
      dispatch(setError('Failed to delete review'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    window.updateReviewCallback = onUpdate;
    dispatch(openReviewModal({
      artistId: review.artist.id,
      name: review.artist.name,
      stage_name: review.artist.stage_name,
      isEditMode: true,
      editReviewId: review.id,
      editReviewTitle: review.review_title,
      editReviewText: review.review_text
    }));
    dispatch(openGlobalModal('review'));
    setShowPopup(false);
  };

  return (
    <div className="absolute top-4 right-4 cursor-pointer z-10" ref={popupRef}>
      <BsThreeDots
        size={20}
        onClick={() => setShowPopup(!showPopup)}
        className="hover:text-gold transition-colors"
      />
      {showPopup && (
        <div className="absolute top-8 right-0 bg-stone-950 rounded-sm shadow-lg z-20 min-w-[120px]">
          <div className="p-2 space-y-1">
            <Button
              type="button"
              text="Edit"
              icon={<FaEdit size={12} />}
              onClick={handleEdit}
              size="small"
              className="w-full"
            />
            <Button
              type="remove"
              text={isDeleting ? "Deleting..." : "Delete"}
              icon={isDeleting ? null : <FaTrash size={12} />}
              onClick={handleDelete}
              size="small"
              className="w-full"
              loading={isDeleting}
              disabled={isDeleting}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default ReviewActions