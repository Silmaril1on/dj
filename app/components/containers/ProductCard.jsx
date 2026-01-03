"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import Title from "@/app/components/ui/Title";
import SpanText from "@/app/components/ui/SpanText";
import ArtistCountry from "@/app/components/materials/ArtistCountry";
import Dot from "@/app/components/ui/Dot";
import { FaStar, FaUsers } from "react-icons/fa";
import { truncateString } from "@/app/helpers/utils";

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
}) => (
  <motion.div
    key={id}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.4, delay: delay * 0.05 }}
    className={`relative bordered bg-stone-900 p-1 group cursor-pointer ${className}`}
  >
    <Link href={href}>
      <div className="h-44 lg:h-80 brightness">
        {image ? (
          <Image
            src={image}
            alt={name}
            className="w-full h-full object-cover"
            width={300}
            height={300}
          />
        ) : (
          <Image
            src="/assets/elivagar-logo.png"
            alt="soundfolio"
            width={300}
            height={300}
          />
        )}
      </div>
      <div className="flex flex-col">
        <Title
          color="cream"
          className="uppercase text-start text-[12px] lg:text-lg xl:text-xl"
          text={truncateString(name, 28)}
        />
        {date && (
          <p className="text-chino uppercase font-bold text-[10px] lg:text-sm">
            {date}
          </p>
        )}
        <ArtistCountry artistCountry={{ country, city }} />
        {/* Add capacity display here */}
        {capacity && (
          <p className="text-chino text-sm">
            Capacity: {capacity.toLocaleString()}
          </p>
        )}
      </div>
      {artists.length > 0 && (
        <div className="flex flex-wrap">
          {artists.slice(0, 5).map((artist, idx) => (
            <div className="flex mr-2 space-x-1" key={idx}>
              <Title
                color="chino"
                className="uppercase text-[12px] lg:text-lg"
                text={artist}
              />
              {idx < artists.length - 1 && <Dot />}
            </div>
          ))}
        </div>
      )}
      {score && (
        <div className="absolute z-10 top-4 left-4 ">
          <SpanText
            icon={<FaStar />}
            size="xs"
            text={`${score}`}
            className="secondary pointer-events-none "
          />
        </div>
      )}
      {typeof likesCount === "number" && likesCount > 0 && (
        <div className="absolute center space-x-2 top-4 right-4 ">
          <SpanText
            icon={<FaUsers />}
            size="xs"
            text={`${likesCount} ${artists.length > 0 ? "Interested" : "Followers"}`}
            className="ml-2 secondary pointer-events-none"
          />
        </div>
      )}
    </Link>
  </motion.div>
);

export default ProductCard;
