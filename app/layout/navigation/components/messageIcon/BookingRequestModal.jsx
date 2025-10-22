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

  return (
    <PopUpBox
      isOpen={isOpen && !isClosing}
      className="absolute bottom-2.5 lg:bottom-auto lg:top-full scale-80 md:scale-100 -right-[160px] md:right-0 lg:mt-3 w-98 bg-stone-800 shadow-xl border border-gold/30 z-50 *:p-3 h-[350px] flex flex-col"
    >
      <BookingHeader onClose={onClose} setIsClosing={setIsClosing} />
      <div className="flex-1 overflow-y-auto">
        <BookingContent
          loading={loading}
          error={error}
          bookingRequests={bookingRequests}
          fetchBookingRequests={fetchBookingRequests}
          userId={userId}
        />
      </div>
      <BookingFooter />
    </PopUpBox>
  );
};

export default BookingRequestModal;