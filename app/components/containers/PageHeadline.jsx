import React from 'react'

const PageHeadline = ({title, description}) => {
  return (
      <div className='px-4 py-10 bg-stone-950'>
          <h1 className='text-2xl lg:text-5xl font-bold'>{title}</h1>
          <p className='secondary text-[10px] md:text-sm text-cream '>{description}</p>
    </div>
  )
}

export default PageHeadline