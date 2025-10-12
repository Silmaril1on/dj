import RatingsStats from '@/app/pages/my-profile-page/statistics/ratings/RatingsStats'
import ArtistReviews from './ArtistReviews';

const ArtistInsight = ({ ratingInsights, reviewsData , artistId }) => {
    if (!ratingInsights) {
        return null
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-3 w-full">
        <RatingsStats
          data={ratingInsights}
          error={ratingInsights.error}
          title="Artist ratings"
          description="Rating stats at a glance, plus a quick breakdown of how this artist has been scored."
        />
        <ArtistReviews data={reviewsData} artistId={artistId} />
      </div>
    );
}

export default ArtistInsight