"use client";
import { useState } from "react";
import Title from '@/app/components/ui/Title';
import Paragraph from '@/app/components/ui/Paragraph';
import ReviewHeader from './ReviewHeader';
import ReviewList from './review-list/ReviewList';
import ReviewFooter from './ReviewFooter';

const ArtistReviews = ({ artist, data = [], error = null }) => {
  const [reviews, setReviews] = useState(data);

  const handleAddReview = (newReview) => {
    setReviews((prev) => [newReview, ...prev]);
  };

  if (error) {
    return (
      <div className="px-[15%] py-10 bg-stone-900 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Title size="lg" text="Error Loading Reviews" />
          <Paragraph text={error} />
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-10 space-y-10 h-full flex flex-col">
      <ReviewHeader artist={artist} data={reviews} />
      <ReviewList data={reviews} artist={artist} setReviews={setReviews} />
      <ReviewFooter artist={artist} onReviewAdd={handleAddReview} />
    </div>
  );
};

export default ArtistReviews;
