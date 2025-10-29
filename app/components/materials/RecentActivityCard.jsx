"use client";
import { motion } from "framer-motion";
import Image from 'next/image';
import Link from 'next/link';

const RecentActivityCard = ({
  item,
  index = 0,
  href,
  imageField = 'artist_image',
  primaryNameField = 'stage_name',
  secondaryNameField = 'name',
  dateField = 'created_at',
  imageAlt = 'Activity item',
  className = "",
  animationDelay = 0.1
}) => {
  const primaryName = item[primaryNameField] || item[secondaryNameField];
  const secondaryName = item[primaryNameField] && item[secondaryNameField] ? item[secondaryNameField] : null;
  const imageUrl = item[imageField] || '/placeholder-artist.jpg';
  const date = new Date(item[dateField]).toLocaleDateString();

  const cardContent = (
    <Link href={href} className="w-full">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: index * animationDelay }}
        className={`flex items-center my-1 gap-3 p-2 bg-stone-800/40 rounded-lg hover:bg-stone-800/80 transition-colors ${className}`}
      >
        <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
          <Image
            src={imageUrl}
            alt={imageAlt}
            width={100}
            height={100}
            className="object-cover w-full h-full"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm capitalize font-bold">
            {primaryName}
          </p>
          {secondaryName && (
            <p className="text-chino/60 text-xs truncate">{secondaryName}</p>
          )}
        </div>
        <div className="text-chino/40 text-xs">
          {date}
        </div>
      </motion.div></Link>
  );


  return cardContent;
};

export default RecentActivityCard;