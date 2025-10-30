import React from 'react'
import ProductCard from '@/app/components/containers/ProductCard'

const AllNews = ({ news = [] }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4">
      {news.map((item, idx) => (
        <ProductCard
          key={item.id}
          id={item.id}
          image={item.news_image}
          name={item.title}
          href={`/news/${item.id}`}
          delay={idx}
        />
      ))}
    </div>
  )
}

export default AllNews