import HomePage from "./pages/home-page/HomePage";
import { getUpcomingEvents } from "@/app/lib/services/events/event";

// ISR: regenerate the home page every 5 minutes.
// The 7 upcoming events are the same for every visitor — no user personalisation
// needed at SSR time. User-specific data (liked status, reminders) is already
// loaded client-side via useEffect inside HomePage.
export const revalidate = 300;

export const metadata = {
  title: "Soundfolio | Home",
  description:
    "Soundfolio — the music production community. Discover DJs, artists, clubs, festivals, and upcoming events. Connect with the best talent in the electronic music world.",
};

export default async function Home() {
  let events = [];
  try {
    // Pass null as cookieStore → getSupabaseServerClient falls back to
    // supabaseAdmin, giving us public event data without user personalisation.
    events = await getUpcomingEvents(null, { limit: 7, userId: null });
  } catch (error) {
    console.error("Error fetching events:", error);
  }

  return <HomePage events={events} />;
}
