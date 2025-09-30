import React from 'react'

export const metadata = {
    title: "DJDB | Reports",
    description: "reports"
}

const ReportsLayout = ({ children , bugs , feedbacks}) => {
  return (
      <div className='flex *:w-full px-4 mt-4 gap-4'>
          {feedbacks}
          {bugs}
    </div>
  )
}

export default ReportsLayout