import { useState } from "react";
import { motion } from "framer-motion";
import RatingButton from "@/app/components/buttons/artist-buttons/RatingButton";
import ArtistCountry from "@/app/components/materials/ArtistCountry";
import ArtistName from "@/app/components/materials/ArtistName";
import Image from "next/image";
import Link from "next/link";
import MetaScore from "@/app/components/materials/MetaScore";
import LikeButton from "@/app/components/buttons/artist-buttons/LikeButton";
import { resolveImage } from "@/app/helpers/utils";

const ArtistCard = ({
  artist,
  cardWidth = 236,
  cardMargin = 8,
  animate,
  delay = 0,
  onAnimationComplete,
}) => {
  const [likesCount, setLikesCount] = useState(artist?.likesCount || 0);
  const userRating = artist?.userRating || null;

  const cardStyle = {
    width: `${cardWidth}px`,
    margin: `0 ${cardMargin}px`,
    minWidth: `${cardWidth}px`,
    flexShrink: 0,
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: (delay) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
        delay,
      },
    }),
  };

  const handleLikeChange = (isLiked, newLikesCount) => {
    setLikesCount(newLikesCount);
  };

  if (!animate) {
    return (
      <div
        style={cardStyle}
        className="border border-gold/30 hover:border-gold/50 bg-gold/20 duration-300 p-1 group relative"
      >
        <Link
          href={`/artists/${artist.artist_slug}`}
          className="flex flex-col h-full relative"
        >
          <div className="w-full h-44 lg:h-64 overflow-hidden relative">
            {resolveImage(artist.image_url, "md") ? (
              <img
                src={resolveImage(artist.image_url, "md")}
                alt={artist.name}
                loading="eager"
                className="brightness-90 group-hover:brightness-100 duration-300 w-full h-full object-cover"
              />
            ) : (
              <Image
                src="/assets/elivagar-logo.png"
                alt={artist.name}
                width={500}
                height={500}
                className="w-full h-full object-cover"
                priority
              />
            )}
            <LikeButton
              size={16}
              className="absolute top-1.5 left-1.5"
              artist={artist}
              onLikeChange={handleLikeChange}
            />
            <RatingButton
              className="absolute top-11.5 left-1.5"
              artist={artist}
              size={16}
              ratingStats={artist.rating_stats}
              userRating={userRating}
              showValue={false}
            />
          </div>
          <article className="w-full mt-1 flex-col flex grow-1 justify-between">
            <ArtistName
              artistName={artist}
              className="leading-5 text-lg lg:text-[22px]"
            />
            <ArtistCountry artistCountry={artist} />
            <MetaScore scoreData={artist?.rating_stats} artistId={artist.id} />
          </article>
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      style={cardStyle}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      custom={delay}
      onAnimationComplete={onAnimationComplete}
      className="border border-gold/30 hover:border-gold/50 bg-gold/20 duration-300 p-1 group relative"
    >
      <Link href={`/artists/${artist.artist_slug}`}>
        <div className="w-full h-44 lg:h-64 overflow-hidden rounded-sm relative">
          {resolveImage(artist.image_url, "md") ? (
            <img
              src={resolveImage(artist.image_url, "md")}
              alt={artist.name}
              loading="lazy"
              className="brightness-90 group-hover:brightness-100 duration-300 w-full h-full object-cover"
            />
          ) : (
            <Image
              src="/assets/elivagar-logo.png"
              alt={artist.name}
              width={500}
              height={500}
              className="w-full h-full object-cover"
            />
          )}
          <LikeButton
            size={16}
            className="absolute top-1.5 left-1.5"
            artist={artist}
            onLikeChange={handleLikeChange}
          />
          <RatingButton
            className="absolute top-11.5 left-1.5"
            artist={artist}
            size={16}
            ratingStats={artist.rating_stats}
            userRating={userRating}
            showValue={false}
          />
        </div>

        <article className="w-full mt-1 flex-col flex grow-1 justify-between">
          <ArtistName
            artistName={artist}
            className="leading-5 text-lg lg:text-[22px]"
          />
          <ArtistCountry artistCountry={artist} />
          <MetaScore scoreData={artist?.rating_stats} artistId={artist.id} />
        </article>
      </Link>
    </motion.div>
  );
};

export default ArtistCard;
