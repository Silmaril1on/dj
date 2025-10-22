"use client"
import Avatar from './hero/Avatar'
import BasicInfo from './hero/BasicInfo';
import Bio from './bio/Bio';
import ArtistSchedule from './schedule/ArtistSchedule';
import ArtistInsight from './artist-insights/ArtistInsight';
import useRecentlyViewed from '@/app/lib/hooks/useRecentlViewed';

const ArtistProfile = ({ data, ratingInsights , reviewsData}) => {
  const scheduleData = data?.artist_schedule;
  const artistId = data?.id
  
useRecentlyViewed("artist", artistId);

  return (
    <div className="min-h-screen">
      <div className="grid lg:grid-cols-2 gap-2 lg:gap-5 items-center min-h-[80vh] p-3 lg:p-5 relative">
        <div className="absolute -z-[1] inset-0 bg-[radial-gradient(circle_at_center,rgb(255_215_0_/_0.2)_2%,rgb(255_215_0_/_0.04)_20%)]" />
        <Avatar data={data} />
        <BasicInfo data={data} />
      </div>
      <Bio data={data} />
      <ArtistSchedule data={scheduleData} />
      <ArtistInsight ratingInsights={ratingInsights} reviewsData={reviewsData} artistId={artistId} />
    </div>
  )
}

export default ArtistProfile
