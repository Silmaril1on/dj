"use client"
import { useState } from 'react';
import PopUpBox from '@/app/components/containers/PopUpBox';
import BookingHeader from './BookingHeader';
import BookingContent from './BookingContent';
import BookingFooter from './BookingFooter';

const BookingRequestModal = ({
  isOpen,
  onClose,
  bookingRequests,
  loading,
  error,
  fetchBookingRequests,
  userId,
}) => {
    const [isClosing, setIsClosing] = useState(false);

  if (!isOpen) return null;

  return (
    <PopUpBox
      isOpen={isOpen && !isClosing}
      className="absolute top-0 md:top-full scale-80 md:scale-100 -right-32 md:right-0 mt-3 w-98 bg-stone-800 shadow-xl border border-gold/30 z-50 *:p-3"
    >
      <BookingHeader onClose={onClose} setIsClosing={setIsClosing} />
      <BookingContent 
        loading={loading} 
        error={error} 
        bookingRequests={bookingRequests}
        fetchBookingRequests={fetchBookingRequests}
        userId={userId}
      />
      <BookingFooter  />
    </PopUpBox>
  );
};

export default BookingRequestModal;