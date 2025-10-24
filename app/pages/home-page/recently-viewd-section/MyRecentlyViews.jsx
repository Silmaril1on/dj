"use client"
import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { selectUser } from '@/app/features/userSlice'
import ProductCard from '@/app/components/containers/ProductCard'
import SectionContainer from '@/app/components/containers/SectionContainer'
import Spinner from '@/app/components/ui/Spinner'
import { motion } from 'framer-motion'

const MyRecentlyViews = () => {
  const user = useSelector(selectUser)
  const [recentItems, setRecentItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    const fetchRecentlyViewed = async () => {
      try {
        const response = await fetch(`/api/recently-viewed?user_id=${user.id}`)
        const result = await response.json()

        if (response.ok && result.data) {
          setRecentItems(result.data)
        }
      } catch (error) {
        console.error('Error fetching recently viewed:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentlyViewed()
  }, [user?.id])

  if (!user) {
    return null
  }

  if (loading) {
    return (
      <SectionContainer
        title="Recently Viewed"
        description="Your recently browsed items"
        className="bg-stone-900"
      >
       <Spinner />
      </SectionContainer>
    )
  }

  if (recentItems.length === 0) {
    return null
  }

  const cardWidth = 176
  const spacing = 12
  const totalContentWidth = recentItems.length * (cardWidth + spacing)
  const visibleWidth = typeof window !== 'undefined' ? window.innerWidth : 375
  const maxScroll = totalContentWidth - visibleWidth + 50

  return (
    <SectionContainer
      title="Recently Viewed"
      description="Your recently browsed items"
      className="bg-stone-900"
    >
      {/* Desktop Grid */}
      <div className="hidden lg:grid lg:grid-cols-6 gap-4">
        {recentItems.map((item, index) => (
          <ProductCard
            key={item.id}
            id={item.id}
            name={item.name}
            image={item.image}
            href={item.href}
            artists={item.artists || []}
            date={item.date}
            animation="fade"
            delay={index * 0.05}
          />
        ))}
      </div>

      {/* Mobile Swiper */}
      <section className="block lg:hidden overflow-hidden">
        <motion.div
          drag="x"
          dragConstraints={{
            left: -maxScroll,
            right: 0,
          }}
          dragElastic={0.1}
          className="flex gap-3 cursor-grab active:cursor-grabbing"
          initial="hidden"
          animate="visible"
        >
          {recentItems.map((item, index) => (
            <motion.div
              key={item.id}
              className="flex-shrink-0"
              style={{ width: cardWidth }}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
                ease: "easeOut"
              }}
            >
              <ProductCard
                id={item.id}
                name={item.name}
                image={item.image}
                href={item.href}
                artists={item.artists || []}
                date={item.date}
                animation="fade"
                delay={0}
              />
            </motion.div>
          ))}
        </motion.div>
      </section>
    </SectionContainer>
  )
}

export default MyRecentlyViews