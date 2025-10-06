import AllEventsPage from "@/app/pages/events/event-page/AllEventsPage";
import { cookies } from "next/headers";

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
    return <AllEventsPage events={events} />;
  } catch (error) {
    return <AllEventsPage events={[]} error={error.message} />;
  }
};

export default EventsPage;
