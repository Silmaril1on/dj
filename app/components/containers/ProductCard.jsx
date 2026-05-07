"use client";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectArtistRatingStats } from "@/app/features/ratingSlice";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import Title from "@/app/components/ui/Title";
import SpanText from "@/app/components/ui/SpanText";
import ArtistCountry from "@/app/components/materials/ArtistCountry";
import Dot from "@/app/components/ui/Dot";
import { FaStar, FaUsers } from "react-icons/fa";
import { resolveImage, truncateString } from "@/app/helpers/utils";
import LikeButton from "@/app/components/buttons/artist-buttons/LikeButton";
import RatingButton from "@/app/components/buttons/artist-buttons/RatingButton";

const ProductCard = ({
  id,
  image,
  name,
  country,
  city,
  artists = [],
  date,
  likesCount,
  capacity,
  href,
  delay = 0,
  className = "",
  score,
  type,
  isLiked: initialIsLiked = false,
  ratingStats = null,
  userRating = null,
}) => {
  // Check Redux for live-updated rating stats (e.g. after user rates without refreshing)
  const reduxRatingStats = useSelector(selectArtistRatingStats(id));
  const effectiveScore = reduxRatingStats?.average_score ?? score;
  const parsedScore = Number(effectiveScore);
  const hasScore = Number.isFinite(parsedScore) && parsedScore > 0;

  const [localLikesCount, setLocalLikesCount] = useState(
    Number(likesCount) || 0,
  );
  const [localIsLiked, setLocalIsLiked] = useState(initialIsLiked);
  const parsedLikesCount = localLikesCount;
  const hasLikesCount = parsedLikesCount > 0;
  const isLikeable =
    type === "club" || type === "festival" || type === "artist";

  // Sync like state when prop changes (e.g. after user-context hydration re-fetch)
  useEffect(() => {
    setLocalIsLiked(initialIsLiked);
  }, [initialIsLiked]);

  // Sync likes count when prop changes
  useEffect(() => {
    setLocalLikesCount(Number(likesCount) || 0);
  }, [likesCount]);

  const resolvedImage = resolveImage(image, "md");

  return (
    <motion.div
      key={id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: delay * 0.05 }}
      className={`relative bordered bg-stone-900 p-1 group cursor-pointer ${className}`}
    >
      <Link href={href}>
        <div className="relative h-44 lg:h-80 brightness overflow-hidden">
          {resolvedImage ? (
            <img
              src={resolvedImage}
              alt={name}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          ) : (
            <Image
              src="/assets/elivagar-logo.png"
              alt="soundfolio"
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 33vw, 400px"
              className="object-cover"
            />
          )}
        </div>
        <div className="flex flex-col *:leading-none mt-1">
          <Title
            color="cream"
            className="uppercase text-start text-[12px] lg:text-lg xl:text-xl leading-none"
            text={truncateString(name, 50)}
          />
          {date && (
            <p className="text-chino uppercase text-[10px] lg:text-sm">
              {date}
            </p>
          )}
          <div>
            <ArtistCountry artistCountry={{ country, city }} />
          </div>
          {capacity && (
            <p className="text-chino text-sm">
              Capacity: {capacity.toLocaleString()}
            </p>
          )}
          {(hasLikesCount || hasScore) && (
            <div className="flex flex-row items-center justify-end gap-4 mt-1 pr-1">
              {hasLikesCount && (
                <SpanText
                  icon={<FaUsers />}
                  size="xs"
                  text={`${parsedLikesCount} ${
                    artists.length > 0 ? "Interested" : "Followers"
                  }`}
                  className="secondary pointer-events-none"
                />
              )}
              {(type === "festival" || type === "club" || type === "artist") &&
                hasScore && (
                  <SpanText
                    icon={<FaStar />}
                    size="xs"
                    text={`${parsedScore}`}
                    className="secondary pointer-events-none"
                  />
                )}
            </div>
          )}
          {artists.length > 0 && (
            <div className="flex flex-wrap mt-2">
              {artists.slice(0, 5).map((artist, idx) => (
                <div className="flex mr-2 space-x-1 items-center" key={idx}>
                  <Title
                    color="chino"
                    className="uppercase text-[12px] lg:text-lg leading-none"
                    text={artist}
                  />
                  {idx < artists.length - 1 && <Dot />}
                </div>
              ))}
            </div>
          )}
        </div>
        {isLikeable && (
          <div className="absolute z-10 top-0 w-full pl-1 pr-4 pt-2 flex flex-col gap-1">
            <div className="flex items-center w-full">
              <LikeButton
                type={type}
                size={13}
                artist={{
                  id,
                  isLiked: localIsLiked,
                  likesCount: parsedLikesCount,
                }}
                onLikeChange={(liked, count) => {
                  setLocalIsLiked(liked);
                  setLocalLikesCount(count);
                }}
              />
            </div>
            {(type === "festival" || type === "club") && (
              <div className="flex items-center w-full">
                <RatingButton
                  entityType={type}
                  artist={{ id, name }}
                  ratingStats={ratingStats}
                  userRating={userRating}
                  size={13}
                  showValue={false}
                  className="pointer-events-auto"
                />
              </div>
            )}
          </div>
        )}
      </Link>
    </motion.div>
  );
};

export default ProductCard;
