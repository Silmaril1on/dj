"use client";
import { useCallback, useMemo } from 'react';
import Paragraph from '@/app/components/ui/Paragraph';
import ListHeader from './ListHeader';
import ListFooter from './ListFooter';
import Title from '@/app/components/ui/Title';
import Motion from '@/app/components/containers/Motion';

const ReviewList = ({ data,  setReviews }) => {

  if (!data || data.length === 0) {
    return (
      <div className=" center grow">
        <div className="text-center">
          <Title size="lg" text="No Reviews Yet" />
          <Paragraph text="Be the first to review this artist!" />
        </div>
      </div>
    );
  }

  const handleReviewUpdate = useCallback((updatedReview) => {
    setReviews(prevReviews =>
      prevReviews.map(review =>
        review.id === updatedReview.id
          ? {
              ...updatedReview,
              userRating: updatedReview.userRating ?? review.userRating,
              users: updatedReview.users ?? review.users // preserve users info
            }
          : review
      )
    );
  }, [setReviews]);

  const reviewItems = useMemo(() => {
    return data?.map((review, index) => {
      const userScore = review.userRating || 'No rating';
      return (
        <Motion
          animation="fade"
          key={review.id}
          className="bg-stone-800/50 p-4 bordered"
        >
          <ListHeader review={review} userScore={userScore} />
          <div className="bg-stone-900 rounded-sm p-3 lg:p-6 border border-stone-700/30">
            <Paragraph text={review.review_text} className='whitespace-pre-wrap' />
          </div>
          <ListFooter review={review} onUpdate={handleReviewUpdate} />
        </Motion>
      );
    });
  }, [data, handleReviewUpdate]);

  return (
    <div className="space-y-3 flex grow flex-col">
      {reviewItems}
    </div>
  );
};

export default ReviewList;