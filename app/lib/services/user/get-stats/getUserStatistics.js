import { getUserLikesCount } from "@/app/lib/services/user/statistics/getUserLikesCount";
import { getUserReviewsCount } from "@/app/lib/services/user/statistics/getUserReviewsCount";
import { getUserRatesCount } from "@/app/lib/services/user/statistics/getUserRatesCount";
import { getUserBookingsStats } from "@/app/lib/services/user/statistics/getUserBookingsStats";
import { getUserSubmittedArtistStats } from "@/app/lib/services/user/statistics/getUserSubmittedArtistStats";
import { getUserSubmittedClubStats } from "@/app/lib/services/user/statistics/getUserSubmittedClubStats";
import { getUserSubmittedEventsStats } from "@/app/lib/services/user/statistics/getUserSubmittedEventsStats";

export async function getUserStatistics() {
  const [
    likesData,
    reviewsData,
    ratingsData,
    bookingsData,
    submittedArtistData,
    submittedClubData,
    submittedEventsData,
  ] = await Promise.all([
    getUserLikesCount().catch(() => null),
    getUserReviewsCount().catch(() => null),
    getUserRatesCount().catch(() => null),
    getUserBookingsStats().catch(() => null),
    getUserSubmittedArtistStats().catch(() => []),
    getUserSubmittedClubStats().catch(() => []),
    getUserSubmittedEventsStats().catch(() => ({
      totalSubmittedEvents: 0,
      recentEvents: [],
    })),
  ]);

  return {
    likes: likesData,
    reviews: reviewsData,
    ratings: ratingsData,
    bookings: bookingsData,
    submittedArtist: submittedArtistData,
    submittedClub: submittedClubData,
    submittedEvents: submittedEventsData,
  };
}
