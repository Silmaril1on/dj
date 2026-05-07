"use client";
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { openReviewModal } from "@/app/features/reviewsSlice";
import { resolveImage } from "@/app/helpers/utils";

import { FaArrowLeft } from "react-icons/fa";
import Title from "@/app/components/ui/Title";
import Paragraph from "@/app/components/ui/Paragraph";
import Button from "@/app/components/buttons/Button";
import ActionButton from "@/app/components/buttons/ActionButton";
import ProfilePicture from "@/app/components/materials/ProfilePicture";
import MyLink from "@/app/components/ui/MyLink";
import ArtistName from "@/app/components/materials/ArtistName";
import ArtistGenres from "@/app/components/materials/ArtistGenres";
import FlexBox from "@/app/components/containers/FlexBox";
import ReviewList from "./ReviewList";

const ArtistReviews = ({
  artist,
  data = [],
  error = null,
  pagination,
  artistId,
}) => {
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
        { cache: "no-store" },
      );
      const result = await res.json();
      const newReviews = result.reviews || [];
      setReviews((prev) => [...prev, ...newReviews]);
      setPage(nextPage);
      setHasMore(result.pagination?.hasNext);
    } catch (err) {
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
    <div className="px-3 lg:px-5 space-y-5 lg:space-y-10 h-full flex flex-col pb-5">
      <ReviewHeader artist={artist} data={reviews} />
      <ReviewList data={reviews} artist={artist} setReviews={setReviews} />
      {hasMore && (
        <div className="flex justify-center mt-6">
          <Button
            text={loading ? "Loading..." : "Load More"}
            onClick={handleLoadMore}
            loading={loading}
            disabled={loading}
          />
        </div>
      )}
      <ReviewFooter artist={artist} onReviewAdd={handleAddReview} />
    </div>
  );
};

const ReviewHeader = ({ artist, data }) => {
  return (
    <div className="flex relative overflow-hidden">
      <div className="absolute inset-0 -z-[1] blur-lg">
        <img loading="lazy"
          src={resolveImage(artist.image_url, "lg")}
          alt={artist.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex flex-col md:flex-row gap-5 bg-black/30 w-full h-full py-10 pl-5">
        <ProfilePicture
          avatar_url={resolveImage(artist.image_url, "md")}
          type="avatar"
        />
        <div className="lg:space-y-2">
          <MyLink
            href={`/artists/${artist.artist_slug}`}
            text="Go to Artist Profile"
            icon={<FaArrowLeft />}
          />
          <ArtistName
            artistName={artist}
            className="leading-12 lg:leading-10 text-3xl lg:text-6xl lg:mt-5 uppercase"
          />
          <ArtistGenres genres={artist?.genres} />
          <Paragraph
            text={`${data.length} review${
              data.length !== 1 ? "s" : ""
            } from the community`}
          />
        </div>
      </div>
    </div>
  );
};

const ReviewFooter = ({ artist, onReviewAdd }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (onReviewAdd) {
      window.addNewReview = onReviewAdd;
    }
    return () => {
      if (window.addNewReview === onReviewAdd) {
        delete window.addNewReview;
      }
    };
  }, [onReviewAdd]);

  const addReview = () => {
    dispatch(
      openReviewModal({
        artistId: artist.id,
        name: artist.name,
        stage_name: artist.stage_name,
      }),
    );
  };

  return (
    <FlexBox type="column-start" className="bg-gold/20 p-5 gap-2">
      <Title size="lg" text="Share Your Experience" />
      <Paragraph text="Have you seen this artist perform? Share your review and help others discover great music!" />
      <ActionButton
        text="Write a Review"
        onClick={addReview}
        authMessage="Please login to review this artist"
      />
    </FlexBox>
  );
};

export default ArtistReviews;
