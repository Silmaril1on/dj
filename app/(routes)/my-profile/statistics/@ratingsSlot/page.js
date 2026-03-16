import RatingsStats from "@/app/(routes)/my-profile/statistics/@ratingsSlot/RatingsStats";
import { getUserRatesCount } from "@/app/lib/services/user/statistics/getUserRatesCount";

export default async function RatingsStatsSlot() {
  try {
    const ratings = await getUserRatesCount();
    return <RatingsStats data={ratings} />;
  } catch (error) {
    console.error("Error fetching rating statistics:", error);
    return <RatingsStats data={null} error={error.message} />;
  }
}
