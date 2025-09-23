'use client'
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { slideTop } from '@/app/framer-motion/motionValues'
import Title from '@/app/components/ui/Title'
import Paragraph from '@/app/components/ui/Paragraph'
import Spinner from '@/app/components/ui/Spinner'
import ArtistName from '@/app/components/materials/ArtistName'
import SectionContainer from '@/app/components/containers/SectionContainer'
import { fakeBornData } from '@/app/localDB/fakeBornData'

const BornToday = () => {
  const [artists, setArtists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchArtistsBornToday()
  }, [])

  const fetchArtistsBornToday = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/artists/born-today')
      const data = await response.json()

      if (response.ok) {
        setArtists(data.data || [])
      } else {
        setError(data.error || 'Failed to fetch artists')
      }
    } catch (err) {
      setError('Network error while fetching artists')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-gold/10 border border-gold/30 rounded-lg p-6">
        <Title text="Born Today" size="lg" className="mb-4" />
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gold/10 border border-gold/30 rounded-lg p-6">
        <Title text="Born Today" size="lg" className="mb-4" />
        <Paragraph text={`Error: ${error}`} className="text-red-500" />
      </div>
    )
  }

  if (!artists || artists.length === 0) {
    return (
      <SectionContainer title="Born Today" description="Browse our artists">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 gap-4 w-full">
          {fakeBornData.map((artist, index) => (
            <motion.div
              key={artist.id}
              variants={slideTop}
              initial="hidden"
              animate="visible"
              transition={{ delay: index * 0.1 }}
              className="group cursor-pointer"
            >
              <Link href={`/artists/${artist.id}`}>
                <div className="bg-stone-900 border border-gold/20 rounded-lg p-2 hover:border-gold/40 transition-colors duration-300">
                  <div className="relative w-full h-32 mb-3 overflow-hidden rounded-lg">
                    <Image
                      src={artist.artist_image}
                      alt={artist.stage_name || artist.name}
                      fill
                      className="object-cover brightness-90 group-hover:brightness-100 duration-300"
                    />
                  </div>
                  <div className="text-center">
                    <ArtistName size="md" artistName={artist} />
                    <p className="text-cream text-xs secondary font-light">
                      Turns {artist.age} today
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </SectionContainer>
    )
  }

  return (

    <SectionContainer title="Born Today" description="Browse our artists">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 w-full">
        {artists.map((artist, index) => (
          <motion.div
            key={artist.id}
            variants={slideTop}
            initial="hidden"
            animate="visible"
            transition={{ delay: index * 0.1 }}
            className="group cursor-pointer"
          >
            <Link href={`/artists/${artist.id}`}>
              <div className="bg-stone-900 border border-gold/20 rounded-lg p-2 hover:border-gold/40 transition-colors duration-300">
                <div className="relative w-full h-32 mb-3 overflow-hidden rounded-lg">
                  <Image
                    src={artist.artist_image}
                    alt={artist.stage_name || artist.name}
                    fill
                    className="object-cover brightness-90 group-hover:brightness-100 duration-300"
                  />
                </div>
                <div className="text-center">
                  <ArtistName artistName={artist} />
                  <p className="text-cream text-xs secondary font-light">
                    Turns {artist.age} today
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </SectionContainer>
  )
}

export default BornToday