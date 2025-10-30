'use client'
import { useState, useEffect } from 'react'
import RatingsStats from '@/app/pages/my-profile-page/statistics/ratings/RatingsStats'
import ArtistReviews from './ArtistReviews';

const ArtistInsight = ({ artistId }) => {
    const [ratingInsights, setRatingInsights] = useState(null)
    const [reviewsData, setReviewsData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchInsightsAndReviews = async () => {
            try {
                setLoading(true)
                
                // Fetch both insights and reviews in parallel
                const [insightsResponse, reviewsResponse] = await Promise.all([
                    fetch(`/api/artists/${artistId}/insights`),
                    fetch(`/api/artists/${artistId}/reviews`)
                ])

                const insightsResult = await insightsResponse.json()
                const reviewsResult = await reviewsResponse.json()

                // Insights API returns data directly (not wrapped)
                if (insightsResult.error) {
                    setError(insightsResult.error)
                } else {
                    setRatingInsights(insightsResult)
                }

                // Reviews API returns { success, data }
                if (reviewsResult.success) {
                    setReviewsData(reviewsResult.data)
                }
            } catch (err) {
                console.error('Error fetching insights and reviews:', err)
                setError('Failed to load data')
            } finally {
                setLoading(false)
            }
        }

        if (artistId) {
            fetchInsightsAndReviews()
        }
    }, [artistId])

    if (loading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-3 w-full min-h-[400px]">
                <div className="flex items-center justify-center bg-stone-900 rounded-lg">
                    <div className="animate-pulse text-gold">Loading insights...</div>
                </div>
                <div className="flex items-center justify-center bg-stone-900 rounded-lg">
                    <div className="animate-pulse text-gold">Loading reviews...</div>
                </div>
            </div>
        )
    }

    if (!ratingInsights || error) {
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