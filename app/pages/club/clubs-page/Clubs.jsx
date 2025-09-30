import React from 'react'
import ProductCard from '@/app/components/containers/ProductCard'

const Clubs = ({ clubs = [] }) => (
  <div>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4">
      {clubs.map((club, idx) => (
        <ProductCard
          key={club.id}
          id={club.id}
          image={club.club_image}
          name={club.name}
          country={club.country}
          city={club.city}
          href={`/clubs/${club.id}`}
          delay={idx * 0.05}
        />
      ))}
    </div>
  </div>
)

export default Clubs