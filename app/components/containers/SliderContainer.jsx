'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import Left from '../buttons/Left'
import Right from '../buttons/Right'
import { slideTop } from '@/app/framer-motion/motionValues'

const SliderContainer = ({
  children,
  items,
  itemsPerPage = 6,
  cardWidth = 236,
  cardMargin = 8,
  animate = false,
  className = ""
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Dynamically calculate container width
  const containerWidth = itemsPerPage * (cardWidth + 2 * cardMargin);

  const wrapperStyle = {
    overflow: "hidden",
    position: "relative",
    display: "flex",
    alignItems: "center",
    width: `${containerWidth}px`,
  };

  const innerStyles = {
    style: {
      transform: `translateX(-${currentIndex * (cardWidth + 2 * cardMargin)}px)`,
      width: `${(cardWidth + 2 * cardMargin) * items?.length}px`,
      transition: "transform 1000ms ease-in-out",
    },
  }

  const slideNext = () => {
    setCurrentIndex((prevIndex) =>
      Math.min(prevIndex + itemsPerPage, items?.length - itemsPerPage)
    )
  }

  const slidePrev = () => {
    setCurrentIndex((prevIndex) => Math.max(prevIndex - itemsPerPage, 0))
  }

  const isLeftVisible = currentIndex > 0
  const isRightVisible = currentIndex + itemsPerPage < items?.length

  return (
    <div className={`relative flex-center flex-col group/slider ${className}`}>
      <div style={wrapperStyle}>
        <div {...innerStyles}>
          <motion.div
            className="flex flex-row relative z-[5]"
            variants={animate ? slideTop : undefined}
            initial={animate ? "hidden" : undefined}
            whileInView={animate ? "visible" : undefined}
            exit={animate ? "exit" : undefined}
          >
            {children}
          </motion.div>
        </div>
      </div>
      <>
        {isLeftVisible && (
          <Left onClick={slidePrev} className='absolute z-10 top-1/2 -translate-y-1/2 left-4 group opacity-0 group-hover/slider:opacity-100 duration-300' />
        )}

        {isRightVisible && (
          <Right onClick={slideNext} className='absolute z-10 top-1/2 -translate-y-1/2 right-4 group opacity-0 group-hover/slider:opacity-100 duration-300' />
        )}
      </>
    </div>
  )
}

export default SliderContainer