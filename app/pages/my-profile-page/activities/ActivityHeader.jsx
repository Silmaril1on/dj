'use client'
import Paragraph from '@/app/components/ui/Paragraph'
import Title from '@/app/components/ui/Title'
import UserActivityCounts from '@/app/components/materials/UserActivityCounts'

const ActivityHeader = ({
  title = "My Activities",
  description = "Track your reviews, ratings, and interactions throughout the platform.",
  showStats = true,
  className = ""
}) => {

  return (
    <div className={`w-full flex items-center justify-start pl-3 lg:pl-10 bg-gold/40 py-20 ${className}`}>
      <div className="space-y-4">
        <div>
          <Title text={title} size="3xl" />
          <Paragraph text={description} />
        </div>
        <UserActivityCounts showStats={showStats} />
      </div>
    </div>
  )
}

export default ActivityHeader