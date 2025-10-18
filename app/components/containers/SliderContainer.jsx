'use client'
import { useState } from 'react'
import Left from '../buttons/Left'
import Right from '../buttons/Right'

const SliderContainer = ({
  children,
  items,
  itemsPerPage = 6,
  cardWidth = 236,
  cardMargin = 8,
  className = ""
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!items || items.length === 0) {
    return <div className="text-red-500 p-4">No items in SliderContainer</div>;
  }

  const containerWidth = itemsPerPage * (cardWidth + 2 * cardMargin);

  const wrapperStyle = {
    overflow: "hidden",
    position: "relative",
    display: "flex",
    alignItems: "center",
    width: `${containerWidth}px`,
    minHeight: "300px",
  };

  const innerStyles = {
    style: {
      transform: `translateX(-${currentIndex * (cardWidth + 2 * cardMargin)}px)`,
      width: `${(cardWidth + 2 * cardMargin) * items.length}px`,
      transition: "transform 1000ms ease-in-out",
      display: "flex",
      alignItems: "center",
      minHeight: "280px",
    },
  }

  const slideNext = () => {
    setCurrentIndex((prevIndex) =>
      Math.min(prevIndex + itemsPerPage, items.length - itemsPerPage)
    )
  }

  const slidePrev = () => {
    setCurrentIndex((prevIndex) => Math.max(prevIndex - itemsPerPage, 0))
  }

  const isLeftVisible = currentIndex > 0
  const isRightVisible = currentIndex + itemsPerPage < items.length

  return (
    <div className={`relative flex flex-col items-center group/slider ${className}`}>
      <div style={wrapperStyle}>
        <div {...innerStyles}>
          <div className="flex flex-row gap-0" style={{ minHeight: "280px", width: "100%" }}>
            {children}
          </div>
        </div>
      </div>
      
      <>
        {isLeftVisible && (
          <Left
            onClick={slidePrev}
            className="absolute z-20 top-1/2 -translate-y-1/2 left-4 opacity-0 group-hover/slider:opacity-100 duration-300"
          />
        )}

        {isRightVisible && (
          <Right
            onClick={slideNext}
            className="absolute z-20 top-1/2 -translate-y-1/2 right-4 opacity-0 group-hover/slider:opacity-100 duration-300"
          />
        )}
      </>
    </div>
  );
}

export default SliderContainer