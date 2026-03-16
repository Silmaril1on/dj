import ActivityStatsCard from "@/app/(routes)/my-profile/statistics/(components)/ActivityStatsCard";
import { getUserSubmittedEventsStats } from "@/app/lib/services/user/statistics/getUserSubmittedEventsStats";

export default async function SubmittedEventsSlot() {
  try {
    const submittedEvents = await getUserSubmittedEventsStats();
    return (
      <ActivityStatsCard
        data={submittedEvents}
        title="Submitted Events"
        description="My Submitted Events Statistics"
        totalKey="totalSubmittedEvents"
        totalLabel="Total Submitted Events"
        itemsKey="recentEvents"
        paragraphText="Your total submitted events and the latest ones you added."
        emptyTitle="No submitted events yet"
        emptyDescription="Submit events to see your statistics!"
        getHref={(e) => `/events/${e.id}`}
        imageField="event_image"
        primaryNameField="event_name"
        secondaryNameField="promoter"
        dateField="created_at"
        getImageAlt={(e) => e.event_name}
      />
    );
  } catch (error) {
    console.error("Error fetching submitted events stats:", error);
    return (
      <ActivityStatsCard
        error={error.message}
        title="Submitted Events"
        description="My Submitted Events Statistics"
      />
    );
  }
}
