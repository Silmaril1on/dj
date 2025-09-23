import AllEventsPage from "@/app/pages/events-page/AllEventsPage";

export const metadata = {
  title: "DJDB | Events",
  description: "events page",
};

const EventsPage = async () => {
  try {
    const response = await fetch(`${process.env.PROJECT_URL}/api/events`, {
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || "Failed to fetch events");
    }

    const result = await response.json();
    const events = result?.data || [];
    return <AllEventsPage events={events} />;
  } catch (error) {
    return <AllEventsPage events={[]} error={error.message} />;
  }
};

export default EventsPage;
