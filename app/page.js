import HomePage from "./pages/home-page/HomePage";
import { cookies } from "next/headers";
import { getServerUser } from "@/app/lib/config/supabaseServer";
import { getUpcomingEvents } from "@/app/lib/services/events/event";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Soundfolio | Home",
  description:
    "Discover and share events with Soundfolio's vibrant community. Explore upcoming events, connect with like-minded individuals, and stay updated on the latest happenings in your area.",
};

export default async function Home() {
  let events = [];
  try {
    const cookieStore = await cookies();
    const { user } = await getServerUser(cookieStore);
    events = await getUpcomingEvents(cookieStore, {
      limit: 7,
      userId: user?.id ?? null,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
  }

  return <HomePage events={events} />;
}
