"use client";
import { useDispatch, useSelector } from "react-redux";
import { selectUser } from "@/app/features/userSlice";
import { openReviewModal } from "@/app/features/reviewsSlice";
import { openGlobalModal, setError } from "@/app/features/modalSlice";

const ReviewButton = ({ className, artist, desc, onReviewAdd }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  const handleReview = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      dispatch(setError("Please login to review this artist"));
      return;
    }
    window.addNewReview = onReviewAdd;
    dispatch(
      openReviewModal({
        artistId: artist.id,
        name: artist.name,
        stage_name: artist.stage_name,
      })
    );
    dispatch(openGlobalModal("review"));
  };

  return (
    <div
      onClick={handleReview}
      className={`bg-gold/30 hover:bg-gold/40 text-gold w-fit secondary center gap-1 cursor-pointer duration-300 p-1 rounded-x text-sm font-bold ${className} `}
    >
      <h1>{desc}</h1>
    </div>
  );
};

export default ReviewButton;
