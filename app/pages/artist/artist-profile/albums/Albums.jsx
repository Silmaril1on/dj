'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import SectionContainer from '@/app/components/containers/SectionContainer'
import Title from '@/app/components/ui/Title'
import Paragraph from '@/app/components/ui/Paragraph'
import SpanText from '@/app/components/ui/SpanText'

const Albums = ({ artistId }) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [hoveredAlbum, setHoveredAlbum] = useState(null)

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/artists/${artistId}/albums`)
        const result = await response.json()
        
        if (result.success) {
          setData(result.data || [])
        } else {
          setError(result.error)
        }
      } catch (err) {
        console.error('Error fetching albums:', err)
        setError('Failed to load albums')
      } finally {
        setLoading(false)
      }
    }

    if (artistId) {
      fetchAlbums()
    }
  }, [artistId])

  if (loading) {
    return (
      <SectionContainer
        title="Albums & Releases"
        description="Discography and music releases"
        className="bg-stone-900 min-h-[300px]"
      >
        <div className="flex items-center justify-center py-10">
          <div className="animate-pulse text-gold">Loading albums...</div>
        </div>
      </SectionContainer>
    )
  }

  if (error || !data || data.length === 0) {
    return null
  }

  const hoveredAlbumData = data.find(album => album.id === hoveredAlbum);

  return (
    <SectionContainer
      title="Albums & Releases"
      description="Discography and music releases"
      className="bg-stone-900 relative"
    >
     <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 lg:px-[13%] gap-3 w-full relative">
        {data.map((album, index) => (
          <motion.div
             key={album.id}
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.5, delay: index * 0.1 }}
             className="relative aspect-square bg-black bordered duration-300 cursor-pointer"
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
          </motion.div>
        ))}
      </div>
      
      {/* Render album info outside of grid */}
      {hoveredAlbumData && <AlbumInfo album={hoveredAlbumData} />}
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
      className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 w-80 max-w-[90vw] bg-black border-2 border-gold/50 p-3 space-y-2 z-50 shadow-2xl pointer-events-none"
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