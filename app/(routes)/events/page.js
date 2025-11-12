import AllDataPage from "@/app/pages/all-data-page/AllDataPage";
import { cookies } from "next/headers";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Soundfolio | Upcoming Events",
  description: "Soundfolio events page",
};

const EventsPage = async () => {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map(({ name, value }) => `${name}=${value}`)
      .join("; ");

    const response = await fetch(
      `${process.env.PROJECT_URL}/api/events/events-page-route?limit=15&offset=0`,
      {
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
        },
      }
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
