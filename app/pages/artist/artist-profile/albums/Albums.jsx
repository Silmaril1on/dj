'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import SectionContainer from '@/app/components/containers/SectionContainer'
import Title from '@/app/components/ui/Title'
import Paragraph from '@/app/components/ui/Paragraph'
import SpanText from '@/app/components/ui/SpanText'

const Albums = ({ data }) => {
  const [hoveredAlbum, setHoveredAlbum] = useState(null)

  if (!data || data.length === 0) {
    return null
  }

  return (
    <SectionContainer
      title="Albums & Releases"
      description="Discography and music releases"
      className="bg-stone-900"
    >
      <div className="flex gap-3">
        {data.map((album, index) => (
          <motion.div
            key={album.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-black bordered relative h-48 w-48 duration-300 cursor-pointer"
            onMouseEnter={() => setHoveredAlbum(album.id)}
            onMouseLeave={() => setHoveredAlbum(null)}
          >
            <div className="absolute inset-0 z-0">
                <Image
                  src={album.album_image}
                  alt={album.name}
                  fill
                  className="object-cover brightness-80 hover:brightness-100 duration-300"
                />
            </div>
            {hoveredAlbum === album.id && <AlbumInfo album={album} />}
          </motion.div>
        ))}
      </div>
    </SectionContainer>
  )
}

const AlbumInfo = ({ album }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className="absolute -top-20 -right-20 w-80 bg-black border-2 border-gold/50 p-3 space-y-2 z-10 shadow-2xl pointer-events-none"
    >
      {/* Album Name */}
      <div>
        <Title 
          text={album.name} 
          size="lg" 
          color="gold" 
          className="uppercase"
        />
        {album.release_date && (
          <Paragraph
            text={new Date(album.release_date).toLocaleDateString()}
            className="text-chino/80 text-sm"
          />
        )}
      </div>

      {/* Description */}
      {album.description && (
        <div>
          <SpanText
          size="xxs"
          font="secondary"
          color="cream"
            text={album.description}
          />
        </div>
      )}

      {/* Tracklist */}
      {album.tracklist && album.tracklist.length > 0 && (
        <div>
          <h4 className="text-gold/80 text-xs font-bold uppercase mb-2">
            Tracklist ({album.tracklist.length} tracks)
          </h4>
          <ul className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
            {album.tracklist.map((track, idx) => (
              <li
                key={idx}
                className="text-chino secondary text-[10px] flex items-start"
              >
                <span className="mr-2 text-gold/70">{idx + 1}.</span>
                <span>{track}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  )
}

export default Albums