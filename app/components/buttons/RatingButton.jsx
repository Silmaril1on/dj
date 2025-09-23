'use client'
import { FaRegStar, FaStar } from "react-icons/fa6";
import { useDispatch, useSelector } from "react-redux";
import { selectUser } from "@/app/features/userSlice";
import { openRatingModal, selectUserRating } from "@/app/features/ratingSlice";
import { openGlobalModal, setError } from "@/app/features/modalSlice";

const RatingButton = ({ artist, ratingStats, userRating, className, desc }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const reduxRating = useSelector(selectUserRating(artist.id));
  const currentRating = reduxRating || userRating || 0;
  const hasUserRating = user && currentRating > 0;

  const handleRatingClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      dispatch(setError('Please login to rate this artist'));
      return;
    }
    dispatch(openRatingModal({
      artistId: artist.id,
      name: artist.name,
      stage_name: artist.stage_name,
      currentRating: currentRating,
      userRating: currentRating,
      averageScore: ratingStats?.average_score || 0,
      totalRatings: ratingStats?.total_ratings || 0,
    }));
    dispatch(openGlobalModal('rating'));
  }

  return (
    <div
      onClick={handleRatingClick}
      className={` bg-gold/30 hover:bg-gold/40 text-gold w-fit secondary center cursor-pointer duration-300 p-1 rounded-xs *:flex *:items-center *:gap-1 text-sm font-bold ${className}`}>
      {hasUserRating ? (
        <div>
          <FaStar size={20} />
          <span>{currentRating}</span>
        </div>
      ) : (
        <div >
          <FaRegStar size={20} />
        </div>
      )}
      {desc && <h1 className="pl-1"> {desc}</h1>}
    </div>
  );
};

export default RatingButton;