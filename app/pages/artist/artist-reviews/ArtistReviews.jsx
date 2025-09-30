"use client";
import { useState } from "react";
import Title from '@/app/components/ui/Title';
import Paragraph from '@/app/components/ui/Paragraph';
import ReviewHeader from './ReviewHeader';
import ReviewList from './review-list/ReviewList';
import ReviewFooter from './ReviewFooter';

const ArtistReviews = ({ artist, data = [], error = null, pagination, artistId }) => {
  const [reviews, setReviews] = useState(data);
  const [page, setPage] = useState(pagination?.page || 1);
  const [hasMore, setHasMore] = useState(pagination?.hasNext || false);
  const [loading, setLoading] = useState(false);

  const handleAddReview = (newReview) => {
    setReviews((prev) => [newReview, ...prev]);
  };

  const handleLoadMore = async () => {
    setLoading(true);
    try {
      const nextPage = page + 1;
      const res = await fetch(
        `/api/artists/review?artistId=${artistId}&limit=10&page=${nextPage}`,
        { cache: "no-store" }
      );
      const result = await res.json();
      const newReviews = result.reviews || [];
      setReviews((prev) => [...prev, ...newReviews]);
      setPage(nextPage);
      setHasMore(result.pagination?.hasNext);
    } catch (err) {
      // Optionally handle error
    } finally {
      setLoading(false);
    }
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
      {hasMore && (
        <div className="flex justify-center mt-6">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="bg-gold text-stone-900 px-6 py-2 rounded font-bold hover:bg-yellow-400"
          >
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
      <ReviewFooter artist={artist} onReviewAdd={handleAddReview} />
    </div>
  );
};

export default ArtistReviews;
