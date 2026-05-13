import HomePage from "./pages/home-page/HomePage";
import { getUpcomingEvents } from "@/app/lib/services/events/event";

export const revalidate = 300;

export const metadata = {
  title: "Soundfolio | Home",
  description:
    "Soundfolio - Electronic music production community. Discover DJs, artists, clubs, festivals, and upcoming events. Connect with the best talent in the electronic music world.",
};

export default async function Home() {
  let events = [];
  try {
    events = await getUpcomingEvents(null, { limit: 7, userId: null });
  } catch (error) {
    console.error("Error fetching events:", error);
  }

  return <HomePage events={events} />;
}
