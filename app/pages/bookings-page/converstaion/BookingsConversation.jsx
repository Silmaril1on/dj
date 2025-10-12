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
import BookingActions from './BookingActions'

const BookingsConversation = ({ selectedBookingId, initialChatUsers = [] }) => {
  const params = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMessages, setHasMessages] = useState(false);
  const [checkingMessages, setCheckingMessages] = useState(false);
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

  // Check if there are messages in booking_chat table
  const checkForMessages = async (bookingId) => {
    if (!bookingId) return;
    try {
      setCheckingMessages(true);
      const response = await fetch(`/api/booking-requests/chat?booking_id=${bookingId}`);
      const data = await response.json();
      
      if (response.ok) {
        const messageCount = data.messages?.length || 0;
        setHasMessages(messageCount > 0);
        console.log(`📊 Messages found for booking ${bookingId}:`, messageCount);
      } else {
        setHasMessages(false);
        console.log(`❌ No messages found for booking ${bookingId}`);
      }
    } catch (error) {
      console.error('Error checking messages:', error);
      setHasMessages(false);
    } finally {
      setCheckingMessages(false);
    }
  };

  // Handle booking updates from child components
  const handleBookingUpdate = (updatedBooking) => {
    setBooking(prevBooking => ({
      ...prevBooking,
      ...updatedBooking
    }));
  };

  useEffect(() => {
    if (currentBookingId) {
      fetchBookingDetails(currentBookingId);
      checkForMessages(currentBookingId);
    } else {
      setBooking(null);
      setHasMessages(false);
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

  if (loading || checkingMessages) {
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

  // Determine when to show different components
  const isBookingConfirmed = booking?.response === "confirmed";
  const shouldShowChat = hasMessages && !isBookingConfirmed;

  console.log('🔍 Chat Display Logic:', {
    bookingId: booking.id,
    hasMessages,
    isBookingConfirmed,
    shouldShowChat,
    response: booking.response
  });

  return (
    <div className="w-[70%]">
      <SectionContainer
        title="Booking Details"
        description="booking information"
        className="bg-stone-900"
      >
        <div className="flex-1 overflow-y-auto space-y-4">
          <EventDetails booking={booking} />
          {/* Only show BookingChat when there are actual messages AND booking is not confirmed */}
          {shouldShowChat && (
            <BookingChat
              bookingId={booking.id}
              bookingData={booking}
              onBookingUpdate={handleBookingUpdate}
            />
          )}
        </div>
      </SectionContainer>
    </div>
  );
};

export default BookingsConversation;
