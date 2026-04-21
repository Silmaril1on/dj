import { notFound } from "next/navigation";
import {
  ACTIVITY_TAB_CONFIGS,
  VALID_ACTIVITY_TABS,
} from "../(components)/activityConfigs";
import { getActivityRatings } from "@/app/lib/services/user/activities/getActivityRatings";
import { getActivityReviews } from "@/app/lib/services/user/activities/getActivityReviews";
import { getActivityMyEvents } from "@/app/lib/services/user/activities/getActivityMyEvents";
import { getActivityReminders } from "@/app/lib/services/user/activities/getActivityReminders";
import MyEvents from "@/app/(routes)/my-profile/activities/(components)/MyEvents";
import Reminders from "@/app/(routes)/my-profile/activities/(components)/Reminders";
import ErrorCode from "@/app/components/ui/ErrorCode";
import UserRatingsPage from "../(components)/UserRatingsPage";
import ReviewList from "../(components)/ReviewList";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { tab } = await params;
  return ACTIVITY_TAB_CONFIGS[tab]?.metadata ?? {};
}

export async function generateStaticParams() {
  return VALID_ACTIVITY_TABS.map((tab) => ({ tab }));
}

export default async function ActivityTabPage({ params, searchParams }) {
  const { tab } = await params;
  const resolvedSearchParams = await searchParams;

  if (!VALID_ACTIVITY_TABS.includes(tab)) notFound();

  const page = parseInt(resolvedSearchParams?.page) || 1;

  try {
    switch (tab) {
      case "ratings": {
        const data = await getActivityRatings(page);
        return <UserRatingsPage ratingsData={data} currentPage={page} />;
      }

      case "reviews": {
        const data = await getActivityReviews(page);
        return <ReviewList reviewsData={data} />;
      }

      case "my-events": {
        const { allEvents } = await getActivityMyEvents();
        return <MyEvents events={allEvents} />;
      }

      case "reminders": {
        const reminders = await getActivityReminders();
        return <Reminders reminders={reminders} />;
      }

      default:
        notFound();
    }
  } catch (err) {
    return (
      <div className="bg-stone-900 center w-full h-full p-8 text-center">
        <ErrorCode
          title="Failed to load"
          description={err.message || "Something went wrong"}
        />
      </div>
    );
  }
}
