"use client";
import { useCallback, useMemo } from 'react';
import Paragraph from '@/app/components/ui/Paragraph';
import ListHeader from './ListHeader';
import ListFooter from './ListFooter';
import Title from '@/app/components/ui/Title';

const ReviewList = ({ data, artist, setReviews }) => {

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
        review.id === updatedReview.id ? updatedReview : review
      )
    );
  }, [setReviews]);

  const reviewItems = useMemo(() => {
    return data?.map((review) => {
      const userScore = review.userRating || 'No rating';
      return (
        <div
          key={review.id}
          className="bg-stone-800/50 border border-gold/30 rounded-sm p-4 hover:border-gold/40 transition-all duration-300"
        >
          <ListHeader review={review} userScore={userScore} />
          <div className="bg-stone-900 rounded-sm p-6 border border-stone-700/30">
            <Paragraph text={review.review_text} className='whitespace-pre-wrap' />
          </div>
          <ListFooter review={review} onUpdate={handleReviewUpdate} />
        </div>
      );
    });
  }, [data, handleReviewUpdate]);

  return (
    <div className="space-y-8 flex grow flex-col">
      {reviewItems}
    </div>
  );
};

export default ReviewList;