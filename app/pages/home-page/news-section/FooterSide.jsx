import React from 'react'

const FooterSide = ({ currentIndex, handleDotClick, newsData}) => {
  return (
    <div className="flex justify-center items-center gap-2 mt-6">
      {newsData.map((_, index) => (
        <button
          key={index}
          onClick={() => handleDotClick(index)}
          className={`w-2 lg:w-3 h-2 lg:h-3 duration-300 cursor-pointer ${
            index === currentIndex
              ? "bg-yellow-500 scale-110"
              : "bg-chino hover:bg-cream"
          }`}
          aria-label={`Go to news item ${index + 1}`}
        />
      ))}
    </div>
  );
}

export default FooterSide