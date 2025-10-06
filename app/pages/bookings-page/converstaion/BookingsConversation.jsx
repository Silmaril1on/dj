"use client"
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Paragraph from '@/app/components/ui/Paragraph'
import Title from '@/app/components/ui/Title'
import SpanText from '@/app/components/ui/SpanText'
import BookingActions from './BookingActions'
import ArtistCountry from '@/app/components/materials/ArtistCountry'
import Location from '@/app/components/materials/Location'
import { capitalizeFirst, formatTime } from '@/app/helpers/utils'
import SectionContainer from '@/app/components/containers/SectionContainer'
import Spinner from '@/app/components/ui/Spinner'
import ErrorCode from '@/app/components/ui/ErrorCode'

const BookingsConversation = ({ selectedBookingId, initialChatUsers = [] }) => {
  const params = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const currentBookingId = selectedBookingId || params?.bookingId || (initialChatUsers.length > 0 ? initialChatUsers[0].id : null);

  const fetchBookingDetails = async (bookingId) => {
    if (!bookingId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/booking-requests/${bookingId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch booking details');
      }
      
      setBooking(data.booking);
    } catch (err) {
      setError(err.message);
      setBooking(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentBookingId) {
      fetchBookingDetails(currentBookingId);
    } else {
      setBooking(null);
    }
  }, [currentBookingId]);


  if (!currentBookingId || initialChatUsers.length === 0) {
    return (
      <div className="w-[70%] flex items-center justify-center">
        <div className="text-center">
          <Title text="No Booking Requests" />
          <Paragraph text="You don't have any booking requests at the moment" className="text-stone-400 mt-2" />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-[70%] flex items-center justify-center">
       <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-[70%] flex items-center justify-center">
        <div className="text-center">
          <Title text="Error" className="text-red-400" />
          <Paragraph text={error} className="text-stone-400 mt-2" />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="w-[70%] flex items-center justify-center">
       <ErrorCode text="Booking details not found."  description='No booking information is available for this request.'/>
      </div>
    );
  }

  return (
    <div className="w-[70%]">
      <SectionContainer title="Booking Details" description="booking information" className='bg-stone-900'>
        <div className="flex-1 overflow-y-auto">
          <div className="bg-stone-950 rounded-sm p-3">
            <Title
              text="Event Information"
              size="sm"
              className="mb-4 text-gold"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <SpanText
                  text="Event Name"
                  size="xs"
                />
                <SpanText
                  color="cream"
                  size="xs"
                  font="secondary"
                  text={booking.event_name}
                  className="font-medium"
                />
              </div>
              <div>
                <SpanText text="Venue Name"  size="xs" />
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
                <SpanText
                  text="Event Location"
                  size="xs"
                />
                <ArtistCountry
                  artistCountry={{
                    country: booking.country,
                    city: booking.city,
                  }}
                />
              </div>
              {booking.address && (
                <div>
                  <SpanText
                    text="Event Address:"
                    size="xs"
                  />
                  <Location
                    address={booking.address}
                    location_url={booking.location_url}
                  />
                </div>
              )}
            </div>

            {booking.lineup && (
              <div className="mt-4">
                <SpanText
                  text="Event Details"
                  size="xs"
                />
                <SpanText
                  text={capitalizeFirst(booking.lineup)}
                  color="cream"
                  size="xs"
                  font="secondary"
                />
              </div>
            )}
          </div>
          <BookingActions booking={booking} />
        </div>
      </SectionContainer>
    </div>
  );
};

export default BookingsConversation;
