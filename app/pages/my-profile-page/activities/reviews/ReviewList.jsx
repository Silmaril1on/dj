'use client'
import FlexBox from '@/app/components/containers/FlexBox'
import ProfilePicture from '@/app/components/materials/ProfilePicture'
import Paragraph from '@/app/components/ui/Paragraph'
import SpanText from '@/app/components/ui/SpanText'
import React, { useState } from 'react'
import ReviewActions from './ReviewActions'
import Title from '@/app/components/ui/Title'
import { formatTime } from '@/app/helpers/utils'
import { motion, AnimatePresence } from 'framer-motion'
import ArtistName from '@/app/components/materials/ArtistName'

const ReviewList = ({ reviewsData, onReviewUpdate }) => {
  const [reviews, setReviews] = useState(reviewsData.reviews);
  const [deletingIds, setDeletingIds] = useState(new Set());

  const handleDeleteReview = (reviewId) => {
    setDeletingIds(prev => new Set([...prev, reviewId]));

    // Add a delay to allow the animation to complete before removing from state
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
    }, 300);
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

  return (
    <div className='space-y-3'>
      <AnimatePresence mode="popLayout">
        {reviews.map((item) => {
          return (
            <motion.div
              key={item.id}
              className='border relative p-3 border-gold/20 rounded-sm bg-stone-900 space-y-3 overflow-hidden'
              initial={{ opacity: 0, x: 0 }}
              animate={{
                opacity: deletingIds.has(item.id) ? 0 : 1,
                x: deletingIds.has(item.id) ? -300 : 0,
                transition: {
                  duration: 0.4,
                  ease: "easeInOut"
                }
              }}
              exit={{
                opacity: 0,
                x: -300,
                transition: {
                  duration: 0.4,
                  ease: "easeInOut"
                }
              }}
              layout
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
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

export default ReviewList