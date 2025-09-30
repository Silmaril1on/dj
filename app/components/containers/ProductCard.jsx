import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Motion from '@/app/components/containers/Motion'
import Title from '@/app/components/ui/Title'
import SpanText from '@/app/components/ui/SpanText'
import ArtistCountry from '@/app/components/materials/ArtistCountry'
import Dot from '@/app/components/ui/Dot'
import { FaUsers } from 'react-icons/fa'

const ProductCard = ({
  id,
  image,
  name,
  date,
  country,
  city,
  artists = [],
  likesCount,
  href,
  animation = "fade",
  delay = 0,
  className = "",
}) => (
  <Motion
    key={id}
    layout
    animation={animation}
    delay={delay}
    className={`relative border border-gold/30 hover:border-gold/50 bg-stone-900 p-2 group cursor-pointer ${className}`}
  >
    <Link href={href || "#"}>
      <div className="h-80 brightness">
        <Image
          src={image}
          alt={name}
          className="w-full h-full object-cover"
          width={300}
          height={300}
        />
      </div>
      <div className="flex flex-col">
        <Title size="sm" color="cream" className="uppercase" text={name} />
        {date && <p className="text-chino uppercase font-bold">{date}</p>}
        <ArtistCountry artistCountry={{ country, city }} />
      </div>
      {artists.length > 0 && (
        <div className="flex flex-wrap">
          {artists.slice(0, 5).map((artist, idx) => (
            <div className="flex mr-2 space-x-1" key={idx}>
              <Title color="chino" className="uppercase" text={artist} />
              {idx < artists.length - 1 && <Dot />}
            </div>
          ))}
        </div>
      )}
      {typeof likesCount === "number" && (
        <div className="absolute center space-x-2 top-4 right-4">
          <SpanText
            icon={<FaUsers />}
            size="xs"
            text={`${likesCount} Interested`}
            className="ml-2 secondary pointer-events-none"
          />
        </div>
      )}
    </Link>
  </Motion>
);

export default ProductCard