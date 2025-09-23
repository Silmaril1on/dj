import { useState } from 'react'
import { motion } from 'framer-motion'
import RatingButton from '@/app/components/buttons/RatingButton'
import ArtistCountry from '@/app/components/materials/ArtistCountry'
import ArtistName from '@/app/components/materials/ArtistName'
import Image from 'next/image'
import Link from 'next/link'
import MetaScore from '@/app/components/materials/MetaScore'
import LikeButton from '@/app/components/buttons/LikeButton'
import FlexBox from '@/app/components/containers/FlexBox'
import { slideTop } from '@/app/framer-motion/motionValues'

const ArtistCard = ({ artist, cardWidth = 236, cardMargin = 8 }) => {
  const [likesCount, setLikesCount] = useState(artist.likesCount || 0);
  const userRating = artist.userRating || null;

  const cardStyle = {
    width: `${cardWidth}px`,
    margin: `0 ${cardMargin}px`,
  }

  const handleLikeChange = (isLiked, newLikesCount) => {
    setLikesCount(newLikesCount);
  };

  return (
    <motion.div
      style={cardStyle}
      variants={slideTop}
      className='border border-gold/30 hover:border-gold/50 bg-gold/20 duration-300 p-1 group relative'
    >
      <Link href={`/artists/${artist.id}`} >
        <div className="w-full h-64 overflow-hidden">
          <Image
            className="brightness-90 group-hover:brightness-100 duration-300 w-full h-full object-cover"
            src={artist.artist_image}
            width={500}
            height={500}
            alt={artist.name}
            priority
          />
        </div>
        <article className='w-full mt-1'>
          <ArtistName size="lg" artistName={artist} className='leading-5' />
          <ArtistCountry artistCountry={artist} />
          <MetaScore scoreData={artist?.rating_stats} artistId={artist.id} />
          <FlexBox type="row-start" className="gap-1 ">
            <RatingButton
              artist={artist}
              ratingStats={artist.rating_stats}
              userRating={userRating}
            />
            <LikeButton
              artist={artist}
              onLikeChange={handleLikeChange}
            />
          </FlexBox>
        </article>
      </Link>
    </motion.div>
  )
}

export default ArtistCard