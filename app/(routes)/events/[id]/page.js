import EventProfile from "@/app/pages/events/event-profile-page/EventProfile";
import { cookies } from "next/headers";

export const generateMetadata = async ({ params }) => {
  const { id } = await params;
  try {
    const response = await fetch(
      `${process.env.PROJECT_URL}/api/events/single-event${id}`,
      { cache: "no-store" }
    );
    const  event  = await response.json();
    return {
      title: `Event |  ${capitalizeFirstLetter(event.data.name)} `,
    };
  } catch (error) {
    return { title: "Event Not Found" };
  }
};

const EventProfilePage = async ({ params }) => {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  const { id } = await params;
 const response = await fetch(`${process.env.PROJECT_URL}/api/events/single-event/${id}`, {
   cache: "no-store",
   headers: {
     "Content-Type": "application/json",
     Cookie: cookieHeader,
   },
 });
const event = await response.json();

  if (!event) {
    return (
      <div className="w-full flex justify-center items-center h-96">
        <div className="bg-stone-900 border border-red-400/30 rounded-lg p-8 text-center">
          <h2 className="text-red-400 text-2xl mb-2">Event Not Found</h2>
          <p className="text-stone-300">
            {error || "This event does not exist."}
          </p>
        </div>
      </div>
    );
  }

  
  return <EventProfile event={event} />;
};


export default EventProfilePage;
