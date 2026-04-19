import ActivityStatsCard from "@/app/(routes)/my-profile/statistics/(components)/ActivityStatsCard";
import { getUserReviewsCount } from "@/app/lib/services/user/statistics/getUserReviewsCount";

export default async function ReviewsStatsSlot() {
  try {
    const reviews = await getUserReviewsCount();
    return (
      <ActivityStatsCard
        data={reviews}
        title="Reviews"
        description="My Review Statistics"
        totalKey="totalReviews"
        totalLabel="Total Reviews"
        itemsKey="recentArtists"
        paragraphText="See how many reviews you've dropped and revisit your most recent ones."
        getHref={(a) => `/artists/${a.artist_slug}`}
        imageField="image_url"
        primaryNameField="stage_name"
        secondaryNameField="name"
        dateField="reviewed_at"
        getImageAlt={(a) => a.stage_name || a.name}
      />
    );
  } catch (error) {
    console.error("Error fetching reviews statistics:", error);
    return (
      <ActivityStatsCard
        error={error.message}
        title="Reviews"
        description="My Review Statistics"
      />
    );
  }
}
