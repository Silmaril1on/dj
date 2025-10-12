'use client'
import { useSelector } from 'react-redux';
import { selectArtistRatingStats } from '@/app/features/ratingSlice';
import FlexBox from '@/app/components/containers/FlexBox';

const LinkActions = ({ data }) => {
  const { likesCount, rating_stats, artist_schedule } = data;
  const reduxStats = useSelector(selectArtistRatingStats(data.id));
  const scores = reduxStats || rating_stats;

  return (
    <div className='grow-1 grid grid-cols-1 md:grid-cols-2 gap-4'>
      <Scores scores={scores} likesCount={likesCount} scheduleCount={artist_schedule?.length || 0} />
    </div>
  )
}

const Scores = ({ scores, likesCount, scheduleCount }) => {
  return (
    <div className="grid *:font-bold pointer-events-none gap-2">
      <div className="space-x-2 flex items-center">
        <span className="bg-gold/20 text-gold text-5xl px-3 py-1 rounded-md min-w-18 text-center">
          {scores?.average_score}
        </span>
        <FlexBox type="column-start">
          <span className="text-lg text-gold"> Listeners score</span>
          <span className="text-chino italic text-xs font-normal secondary">
            {scores?.total_ratings}{" "}
            {scores?.total_ratings === 1 ? "user" : "users"} has rates
          </span>
        </FlexBox>
      </div>
      <div className="space-x-2 flex items-center">
        <span className="bg-gold/20 text-gold text-5xl px-3 py-1 rounded-md min-w-18 text-center">
          {likesCount}
        </span>
        <FlexBox type="column-start">
          <span className="text-lg text-gold">Popularity Score</span>
          <span className="text-chino italic text-xs font-normal secondary">
            {likesCount} {likesCount === 1 ? "user" : "users"} like this artist
          </span>
        </FlexBox>
      </div>
      <div className="space-x-2 flex items-center">
        <span className="bg-gold/20 text-gold text-5xl px-3 py-1 rounded-md min-w-18 text-center">
          {scheduleCount}
        </span>
        <FlexBox type="column-start">
          <span className="text-lg text-gold">Upcoming Dates</span>
          <span className="text-chino italic text-xs font-normal secondary">
            {scheduleCount} {scheduleCount === 1 ? "date" : "dates"} scheduled
          </span>
        </FlexBox>
      </div>
    </div>
  );

}

export default LinkActions