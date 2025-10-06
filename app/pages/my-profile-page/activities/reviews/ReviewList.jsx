'use client'
import FlexBox from '@/app/components/containers/FlexBox'
import ProfilePicture from '@/app/components/materials/ProfilePicture'
import Paragraph from '@/app/components/ui/Paragraph'
import SpanText from '@/app/components/ui/SpanText'
import { useState } from 'react'
import ReviewActions from './ReviewActions'
import Title from '@/app/components/ui/Title'
import { formatTime } from '@/app/helpers/utils'
import { AnimatePresence } from 'framer-motion'
import ArtistName from '@/app/components/materials/ArtistName'
import Motion from '@/app/components/containers/Motion'
import ErrorCode from '@/app/components/ui/ErrorCode'
import Button from '@/app/components/buttons/Button'

const ReviewList = ({ reviewsData, onReviewUpdate }) => {
  const [reviews, setReviews] = useState(reviewsData?.reviews || []);
  const [page, setPage] = useState(reviewsData?.pagination?.page || 1);
  const [hasNext, setHasNext] = useState(reviewsData?.pagination?.hasNext || false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [deletingIds, setDeletingIds] = useState(new Set());

  const handleDeleteReview = (reviewId) => {
    setDeletingIds(prev => new Set([...prev, reviewId]));

    setTimeout(() => {
      setReviews(prevReviews => prevReviews.filter(review => review.id !== reviewId));
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(reviewId);
        return newSet;
      });
      if (onReviewUpdate) {
        onReviewUpdate();
      }
    }, 400); 
  };

  const handleUpdateReview = (updatedReview) => {
    setReviews(prevReviews =>
      prevReviews.map(review =>
        review.id === updatedReview.id ? updatedReview : review
      )
    );
    if (onReviewUpdate) {
      onReviewUpdate();
    }
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/users/review-stats/user-reviews?page=${page + 1}&limit=20`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (data.success && data.data.reviews.length > 0) {
        setReviews(prev => [...prev, ...data.data.reviews]);
        setPage(prev => prev + 1);
        setHasNext(data.data.pagination.hasNext);
      } else {
        setHasNext(false);
      }
    } catch {
      // Optionally handle error
    } finally {
      setLoadingMore(false);
    }
  };

  if (!reviews.length) {
    return (
      <div className="w-[60%] mx-auto p-8 text-center">
       <ErrorCode title="No Reviews Yet" description="You haven't written any reviews yet." />
      </div>
    );
  }

  return (
    <div className='space-y-3'>
      <AnimatePresence mode="popLayout">
        {reviews.map((item) => (
          <Motion
            key={item.id}
            animation="fade"
            animate={deletingIds.has(item.id) ? "hidden" : "visible"}
            exit="exit"
            className=' relative p-3  bg-stone-900 s bordered  space-y-3 overflow-hidden'
          >
            <ReviewActions
              review={item}
              onDelete={handleDeleteReview}
              onUpdate={handleUpdateReview}
            />
            <FlexBox type="row-start" className="items-center gap-3 border-b border-gold/20 pb-2">
              <ProfilePicture avatar_url={item.artist.artist_image} />
              <ArtistName artistName={item.artist} />
            </FlexBox>
            <FlexBox type="column-start" className="items-center ">
              <Title size="xs" color="chino" text={item.review_title} />
              <div className='bg-stone-800 px-5 py-2 rounded-sm'>
                <Paragraph text={item.review_text} />
              </div>
            </FlexBox>
            <FlexBox type="row-start" className="items-center">
              <SpanText text={formatTime(item.created_at)} size='xs' font='secondary' />
            </FlexBox>
          </Motion>
        ))}
      </AnimatePresence>
      {hasNext && (
        <div className="flex justify-center mt-8">
          <Button
            text={loadingMore ? "Loading..." : "Load More"}
            onClick={handleLoadMore}
            disabled={loadingMore}
            loading={loadingMore}
          />
        </div>
      )}
    </div>
  )
}

export default ReviewList