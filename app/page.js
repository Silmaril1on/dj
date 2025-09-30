import HomePage from "./pages/home-page/HomePage";
import { cookies } from "next/headers";

export default async function Home() {
  let events = [];
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map(({ name, value }) => `${name}=${value}`)
      .join("; ");

    const eventsUrl = new URL(`${process.env.PROJECT_URL}/api/events`);
    const eventsResponse = await fetch(eventsUrl.toString(), {
      cache: "no-store",
      headers: {
        Cookie: cookieHeader,
      },
    });
    const eventsData = await eventsResponse.json();

    if (eventsData.success) {
      events = eventsData.data || [];
    }
  } catch (error) {
    console.error("Error fetching events:", error);
  }

  return <HomePage events={events} />;
}
