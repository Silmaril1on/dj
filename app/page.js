import HomePage from "./pages/home-page/HomePage";
import { getUpcomingEvents } from "@/app/lib/services/events/event";
import { resolveImage, isOnOrAfterToday } from "@/app/helpers/utils";

export const revalidate = 300;

export const metadata = {
  title: "Soundfolio",
  description:
    "Soundfolio - Electronic music production community. Discover DJs, artists, clubs, festivals, and upcoming events. Connect with the best talent in the electronic music world.",
};

export default async function Home() {
  let events = [];
  try {
    events = await getUpcomingEvents(null, { limit: 10, userId: null });
  } catch (error) {
    console.error("Error fetching events:", error);
  }

  // Emit a server-side preload hint so the browser fetches the LCP image
  // before any JavaScript runs — significantly reduces LCP time.
  const lcpEvent = events.find((e) => isOnOrAfterToday(e?.date));
  const lcpImageUrl = lcpEvent ? resolveImage(lcpEvent.image_url, "md") : null;

  return (
    <>
      {lcpImageUrl && (
        <link
          rel="preload"
          as="image"
          href={lcpImageUrl}
          fetchPriority="high"
        />
      )}
      <HomePage events={events} />
    </>
  );
}
