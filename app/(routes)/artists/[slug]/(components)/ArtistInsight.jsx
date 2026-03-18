"use client";
import { useState, useEffect } from "react";
import RatingsStats from "@/app/(routes)/my-profile/statistics/@ratingsSlot/RatingsStats";
import ArtistReviews from "./ArtistReviews";

async function parseJsonResponse(response, fallbackMessage) {
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    throw new Error(fallbackMessage);
  }

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || fallbackMessage);
  }

  return payload;
}

const ArtistInsight = ({ artistId, slug }) => {
  const [ratingInsights, setRatingInsights] = useState(null);
  const [reviewsData, setReviewsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInsightsAndReviews = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch both insights and reviews in parallel
        const [insightsResponse, reviewsResponse] = await Promise.all([
          fetch(`/api/artists/artist-rating-insights?artistId=${artistId}`),
          fetch(`/api/artists/review/profile-reviews?artistId=${artistId}`),
        ]);

        const [insightsResult, reviewsResult] = await Promise.all([
          parseJsonResponse(
            insightsResponse,
            "Failed to load artist rating insights",
          ),
          parseJsonResponse(reviewsResponse, "Failed to load artist reviews"),
        ]);

        // Insights API returns data directly (not wrapped)
        if (insightsResult.error) {
          setError(insightsResult.error);
        } else {
          setRatingInsights(insightsResult);
        }

        // Reviews API returns { success, data }
        if (reviewsResult.success) {
          setReviewsData(reviewsResult.data);
        } else {
          setReviewsData([]);
        }
      } catch (err) {
        console.error("Error fetching insights and reviews:", err);
        setError("Failed to load data");
        setReviewsData([]);
      } finally {
        setLoading(false);
      }
    };

    if (artistId) {
      fetchInsightsAndReviews();
    }
  }, [artistId]);

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
    );
  }

  if (!ratingInsights || error) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-3 w-full">
      <RatingsStats
        data={ratingInsights}
        error={ratingInsights.error}
        title="Artist ratings"
        description="Rating stats at a glance, plus a quick breakdown of how this artist has been scored."
      />
      <ArtistReviews data={reviewsData} slug={slug} />
    </div>
  );
};

export default ArtistInsight;
