"use client"
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Paragraph from '@/app/components/ui/Paragraph'
import Title from '@/app/components/ui/Title'
import SectionContainer from '@/app/components/containers/SectionContainer'
import Spinner from '@/app/components/ui/Spinner'
import ErrorCode from '@/app/components/ui/ErrorCode'
import BookingChat from './BookingChat'
import EventDetails from './EventDetails'

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
       <ErrorCode text="Booking details not found." description='No booking information is available for this request.'/>
      </div>
    );
  }

  return (
    <div className="w-[70%]">
      <SectionContainer title="Booking Details" description="booking information" className="bg-stone-900">
        <div className="flex-1 overflow-y-auto space-y-4">
           <EventDetails booking={booking} />
           <BookingChat bookingId={booking.id} bookingData={booking} />
        </div>
      </SectionContainer>
    </div>
  );
};

export default BookingsConversation;
