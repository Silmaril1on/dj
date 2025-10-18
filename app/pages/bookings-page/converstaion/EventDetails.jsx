import ArtistCountry from '@/app/components/materials/ArtistCountry';
import SpanText from '@/app/components/ui/SpanText';
import { capitalizeFirst, formatTime } from '@/app/helpers/utils';
import BookingActions from './BookingActions';
import Location from '@/app/components/materials/Location';

const EventDetails = ({ booking }) => {
  return (
    <div className="bg-stone-950 rounded-sm p-3">
      <title text="Event Information" size="sm" className="mb-4 text-gold" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 lg:gap-4">
        <div>
          <SpanText text="Event Name" size="xs" />
          <SpanText
            color="cream"
            size="xs"
            font="secondary"
            text={booking.event_name}
            className="font-medium"
          />
        </div>
        <div>
          <SpanText text="Venue Name" size="xs" />
          <SpanText
            color="cream"
            size="xs"
            font="secondary"
            text={booking.venue_name}
          />
        </div>
        <div>
          <SpanText text="Event Date:" size="xs" />
          <SpanText
            color="cream"
            size="xs"
            font="secondary"
            text={formatTime(booking.event_date)}
          />
        </div>
        {booking.time && (
          <div>
            <SpanText text="Perform Time" size="xs" />
            <SpanText
              color="cream"
              size="xs"
              font="secondary"
              text={booking.time}
            />
          </div>
        )}
        <div>
          <SpanText text="Event Location" size="xs" />
          <ArtistCountry
            artistCountry={{
              country: booking.country,
              city: booking.city,
            }}
          />
        </div>
        {booking.address && (
          <div>
            <SpanText text="Event Address:" size="xs" />
            <Location
              address={booking.address}
              location_url={booking.location_url}
            />
          </div>
        )}
      </div>

      {booking.lineup && (
        <div className="mt-4">
          <SpanText text="Event Details" size="xs" />
          <SpanText
            text={capitalizeFirst(booking.lineup)}
            color="cream"
            size="xs"
            font="secondary"
          />
        </div>
      )}
      <BookingActions booking={booking} />
    </div>
  );
}

export default EventDetails