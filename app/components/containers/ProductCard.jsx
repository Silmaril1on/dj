"use client";
import { useState } from "react";
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
}) => {
  const parsedScore = Number(score);
  const hasScore = Number.isFinite(parsedScore) && parsedScore > 0;
  const [localLikesCount, setLocalLikesCount] = useState(
    Number(likesCount) || 0,
  );
  const [localIsLiked, setLocalIsLiked] = useState(initialIsLiked);
  const parsedLikesCount = localLikesCount;
  const hasLikesCount = parsedLikesCount > 0;
  const isLikeable = type === "club" || type === "festival";

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
          {/* Add capacity display here */}
          {capacity && (
            <p className="text-chino text-sm">
              Capacity: {capacity.toLocaleString()}
            </p>
          )}
          {artists.length > 0 && (
            <div className="flex flex-wrap">
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
        {hasScore && (
          <div className="absolute z-10 top-4 left-4">
            <SpanText
              icon={<FaStar />}
              size="xs"
              text={`${parsedScore}`}
              className="secondary pointer-events-none "
            />
          </div>
        )}
        {isLikeable ? (
          <div className="absolute z-10 top-2 pl-1 pr-4 flex items-center justify-between w-full">
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
            {hasLikesCount && (
              <SpanText
                icon={<FaUsers />}
                size="xs"
                text={`${parsedLikesCount} Followers`}
                className="secondary pointer-events-none"
              />
            )}
          </div>
        ) : (
          hasLikesCount && (
            <div className="absolute center space-x-2 top-4 right-4">
              <SpanText
                icon={<FaUsers />}
                size="xs"
                text={`${parsedLikesCount} ${
                  artists.length > 0 ? "Interested" : "Followers"
                }`}
                className="ml-2 secondary pointer-events-none"
              />
            </div>
          )
        )}
      </Link>
    </motion.div>
  );
};

export default ProductCard;
