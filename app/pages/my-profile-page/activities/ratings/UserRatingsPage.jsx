"use client";
import { useState } from "react";
import { formatTime } from "@/app/helpers/utils";
import Title from "@/app/components/ui/Title";
import Paragraph from "@/app/components/ui/Paragraph";
import SpanText from "@/app/components/ui/SpanText";
import RatingButton from "@/app/components/buttons/RatingButton";
import Image from "next/image";
import Link from "next/link";
import ArtistName from "@/app/components/materials/ArtistName";
import Motion from "@/app/components/containers/Motion";
import ErrorCode from "@/app/components/ui/ErrorCode";

const UserRatingsPage = ({ ratingsData, error, currentPage = 1 }) => {
  const [ratings, setRatings] = useState(ratingsData?.ratings || []);
  const [page, setPage] = useState(currentPage);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasNext, setHasNext] = useState(ratingsData?.pagination?.hasNext || false);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/users/rate-stats/user-rates?page=${page + 1}&limit=20`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (data.success && data.data.ratings.length > 0) {
        setRatings((prev) => [...prev, ...data.data.ratings]);
        setPage((prev) => prev + 1);
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

  if (error) {
    return (
      <div className="w-[60%] mx-auto p-8 text-center">
        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-6">
          <Title text="Error Loading Ratings" size="lg" className="text-red-400 mb-2" />
          <Paragraph text={error} className="text-red-300" />
        </div>
      </div>
    );
  }

  if (!ratingsData) {
    return (
      <div className="w-[60%] mx-auto p-8 text-center">
        <div className="bg-stone-800 border border-gold/20 rounded-lg p-6">
          <Title text="Loading Ratings..." size="lg" className="text-gold" />
        </div>
      </div>
    );
  }

  if (!ratings.length) {
    return (
      <div className="w-[60%] mx-auto p-8 text-center">
       <ErrorCode title="No Ratings Yet" description="You haven't rated any artists yet." />
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-5 gap-4">
        {ratings.map((rating) => (
          <Motion animation="fade" key={rating.id}>
            <Link href={`/artists/${rating.artist.id}`}>
              <div
                key={rating.id}
                className="bg-stone-900 group flex-col flex p-2 bordered"
              >
                <div className="h-34 w-full">
                  <Image
                    src={rating.artist.artist_image}
                    alt={rating.artist.stage_name || rating.artist.name}
                    width={100}
                    height={100}
                    className="object-cover w-full h-full brightness-80 group-hover:brightness-100 duration-300"
                  />
                </div>
                <ArtistName artistName={rating.artist} size="xs" />
                <RatingButton
                  artist={rating.artist}
                  userRating={rating.score}
                  className="text-sm"
                />
                <SpanText
                  className="w-fit"
                  color="chino"
                  size="xs"
                  text={formatTime(rating.created_at)}
                />
              </div>
            </Link>
          </Motion>
        ))}
      </div>
      {hasNext && (
        <div className="flex justify-center mt-8">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="bg-gold/30 hover:bg-gold/40 text-gold px-6 py-2 rounded font-bold text-lg cursor-pointer"
          >
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
};

export default UserRatingsPage;