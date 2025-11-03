
'use client'
import { useSelector } from 'react-redux';
import { selectArtistRatingStats } from '@/app/features/ratingSlice';

const MetaScore = ({ scoreData, artistId }) => {
  const reduxStats = useSelector(selectArtistRatingStats(artistId));
  const stats = reduxStats || scoreData;

  const { average_score, total_ratings } = stats;

  return (
    <div className='*:space-x-1 secondary text-xs font-normal items-center *:flex text-gold'>
      {total_ratings > 0 ?
        <Score average_score={average_score} total_ratings={total_ratings} />
        :
        <div>
          <span className='bg-gold/30 px-1 font-bold rounded-xs'>{average_score}</span>
          <span>No Listeners score</span>
        </div>
      }
    </div>
  )
}


const Score = ({ average_score, total_ratings }) => {
  return (
    <div>
      <span className='bg-gold/30 px-1 font-bold rounded-xs min-w-6 text-center'>{average_score}</span>
      <span>{total_ratings} Listeners score</span>
    </div>
  )
}

export default MetaScore