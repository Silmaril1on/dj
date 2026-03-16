import ActivityStatsCard from "@/app/(routes)/my-profile/statistics/(components)/ActivityStatsCard";
import { getUserStatsCount } from "@/app/lib/services/user/statistics/getUserLikesCount";

export default async function LikesStatsSlot() {
  try {
    const likes = await getUserStatsCount();
    return (
      <ActivityStatsCard
        data={likes}
        title="Likes"
        description="My Like Statistics"
        totalKey="totalLikes"
        totalLabel="Total Likes"
        itemsKey="recentArtists"
        paragraphText="Your total likes and the latest artists you've clicked with. Tap any name to jump into their profile."
        getHref={(a) => `/artists/${a.artist_slug}`}
        imageField="artist_image"
        primaryNameField="stage_name"
        secondaryNameField="name"
        dateField="liked_at"
        getImageAlt={(a) => a.stage_name || a.name}
      />
    );
  } catch (error) {
    console.error("Error fetching likes statistics:", error);
    return (
      <ActivityStatsCard
        error={error.message}
        title="Likes"
        description="My Like Statistics"
      />
    );
  }
}
