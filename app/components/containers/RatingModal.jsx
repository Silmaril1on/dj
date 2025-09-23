'use client'
import { useSelector, useDispatch } from 'react-redux';
import { useState } from 'react';
import { FaStar } from 'react-icons/fa6';
import { selectUser } from '@/app/features/userSlice';
import { selectRatingModal, closeRatingModal, setRatingModalRating, updateUserRating, updateRatingStats } from '@/app/features/ratingSlice';
import { closeGlobalModal, setError, openGlobalModal } from '@/app/features/modalSlice';
import { openReviewModal } from '@/app/features/reviewsSlice';
import Close from '@/app/components/buttons/Close';
import ArtistName from '../materials/ArtistName';
import Button from '../buttons/Button';
import FlexBox from './FlexBox';

const RatingModal = () => {
  const user = useSelector(selectUser);
  const ratingModal = useSelector(selectRatingModal);
  const dispatch = useDispatch();
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    dispatch(closeRatingModal());
    dispatch(closeGlobalModal());
  };

  const handleStarClick = (rating) => {
    dispatch(setRatingModalRating(rating));
  };

  const handleStarHover = (rating) => {
    setHoveredRating(rating);
  };

  const handleStarLeave = () => {
    setHoveredRating(0);
  };

  const handleSubmit = async () => {
    if (ratingModal.currentRating === 0 || !ratingModal.artistId) return;

    if (ratingModal.currentRating < 6) {
      dispatch(openReviewModal({
        artistId: ratingModal.artistId,
        name: ratingModal.name,
        stage_name: ratingModal.stage_name,
        isLowRating: true,
        rating: ratingModal.currentRating
      }));
      dispatch(openGlobalModal('review'));
      return;
    }

    await submitRating();
  };

  const submitRating = async () => {
    if (ratingModal.currentRating === 0 || !ratingModal.artistId) return;
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/artists/rating', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artistId: ratingModal.artistId,
          rating: ratingModal.currentRating,
          userId: user.id,
          username: user.userName || user.email,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to submit rating');
      }
      const responseData = await response.json();
      dispatch(updateUserRating({
        artistId: ratingModal.artistId,
        rating: ratingModal.currentRating
      }));
      if (responseData.data?.rating_stats) {
        dispatch(updateRatingStats({
          artistId: ratingModal.artistId,
          average_score: responseData.data.rating_stats.average_score,
          total_ratings: responseData.data.total_ratings
        }));
      }
      handleClose();
      dispatch(setError({
        message: `Rating submitted successfully`,
        type: 'success'
      }))
    } catch (error) {
      console.error('Error submitting rating:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!ratingModal.isOpen) return null;

  return (
    <>
      <Close
        className="absolute top-4 right-4"
        onClick={handleClose}
      />
      <div className="text-center mb-6">
        <h2 className='text-gray'>RATE</h2>
        <ArtistName size="xl" artistName={ratingModal} />

        {/* Rating Display */}
        <div className="flex items-center justify-center gap-1 my-5">
          <span className="text-gold text-5xl font-bold">
            {ratingModal.currentRating || 0}
          </span>
          <span className="text-emperor dark:text-white text-lg">/ 10</span>
        </div>

        {/* Current Stats */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="bg-gold/30 px-3 py-1 rounded-sm">
            <span className="text-gold font-bold">
              {ratingModal.currentRating || 0}
            </span>
          </div>
          <span>
            {ratingModal.userRating ? 'Your Rating' : 'No Rating Yet'}
          </span>
        </div>
      </div>

      {/* Star Rating System */}
      <div className="flex justify-center gap-1 mb-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
          <button
            key={star}
            onClick={() => handleStarClick(star)}
            onMouseEnter={() => handleStarHover(star)}
            onMouseLeave={handleStarLeave}
            className={`transition-all duration-200 cursor-pointer ${star <= (hoveredRating || ratingModal.currentRating)
              ? 'text-yellow-400 scale-110'
              : 'text-gold/40'
              } hover:scale-110`}
          >
            <FaStar size={24} />
          </button>
        ))}
      </div>

      {/* Submit Button */}
      <FlexBox>
        <Button
          onClick={handleSubmit}
          loading={isSubmitting}
          text={isSubmitting ? 'Submitting...' : 'Submit Rating'}
          disabled={isSubmitting || ratingModal.currentRating === 0}
        />
      </FlexBox>

    </>
  );
};

export default RatingModal;