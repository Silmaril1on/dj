import AllDataPage from "@/app/pages/all-data-page/AllDataPage";

export const revalidate = 1200;

export const metadata = {
  title: "Soundfolio | Upcoming Events",
  description: "Soundfolio events page",
};

const EventsPage = async () => {
  try {
    const response = await fetch(
      `${process.env.PROJECT_URL}/api/events/events-page-route?limit=30&offset=0`,
      {
        next: { revalidate: 1200, tags: ["events"] },
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || "Failed to fetch events");
    }

    const result = await response.json();
    const events = result?.data || [];
    return (
      <AllDataPage
        type="events"
        initialData={events}
        title="Upcoming events"
        description="Find the latest events happening near you."
      />
    );
  } catch (error) {
    return (
      <AllDataPage
        type="events"
        initialData={[]}
        error={error.message}
        title="Upcoming events"
        description="Find the latest events happening near you."
      />
    );
  }
};

export default EventsPage;
