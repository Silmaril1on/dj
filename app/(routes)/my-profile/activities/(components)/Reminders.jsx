import ProductCard from "@/app/components/containers/ProductCard";
import ErrorCode from "@/app/components/ui/ErrorCode";
import { formatBirthdate } from "@/app/helpers/utils";

const Reminders = ({ reminders = [], error = null }) => {
  if (error) {
    return (
      <div className="bg-stone-900 center w-full h-full p-8 text-center">
        <ErrorCode title="Failed to load reminders" description={error} />
      </div>
    );
  }

  if (!reminders || reminders.length === 0) {
    return (
      <div className="bg-stone-900 center w-full h-full p-8 text-center">
        <ErrorCode
          title="No Tracked Events"
          description="Like events to track them and get quick access here."
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      {reminders.map((event, idx) => (
        <ProductCard
          key={event.id}
          id={event.id}
          image={event.image_url}
          name={event.venue_name || "Event"}
          country={event.country}
          city={event.city}
          artists={Array.isArray(event.artists) ? event.artists : []}
          date={event.date ? formatBirthdate(event.date) : ""}
          href={`/events/${event.event_slug || event.id}`}
          delay={idx}
          className="p-2"
        />
      ))}
    </div>
  );
};

export default Reminders;
