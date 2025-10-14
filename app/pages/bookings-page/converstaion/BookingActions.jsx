"use client"
import { useDispatch, useSelector } from 'react-redux'
import { openAcceptBookingModal } from '@/app/features/bookingSlice'
import { selectUser } from '@/app/features/userSlice'
import FlexBox from '@/app/components/containers/FlexBox';
import Title from '@/app/components/ui/Title';
import Paragraph from '@/app/components/ui/Paragraph';
import { FaHandshake, FaTimes } from 'react-icons/fa';
import SpanText from '@/app/components/ui/SpanText';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setError } from '@/app/features/modalSlice';

const BookingActions = ({ booking }) => {
  const dispatch = useDispatch()
  const router = useRouter()
  const currentUser = useSelector(selectUser)
  const [declining, setDeclining] = useState(false)

  const handleAcceptBooking = () => {
    if (booking) {
      dispatch(openAcceptBookingModal(booking))
    }
  }

  const handleDeclineBooking = async () => {
    if (!booking?.id) return;
    setDeclining(true);
    try {
      const response = await fetch('/api/booking-requests/booking-decline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          booking_id: booking.id,
          reason: 'Declined by DJ'
        }),
      });

      const data = await response.json();
      if (response.ok) {
        dispatch(setError({ message: 'You have declined booking', type: "success" }));
        router.push("/")
      } else {
        alert(data.error || 'Failed to decline booking');
      }
    } catch (error) {
      dispatch(setError({ message: 'Failed to decline booking', type: "error" }));
    } finally {
      setDeclining(false);
    }
  }

  const isReceiver = currentUser?.id === booking?.receiver_id
  const isRequester = currentUser?.id === booking?.requester_id

  return (
    <div className="bg-stone-950 mt-5 rounded-sm">
      {isReceiver && booking?.response === null ? (
        <FlexBox className="gap-4 *:duration-300 *:cursor-pointer">
          <button
            onClick={handleAcceptBooking}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-sm font-medium transition-colors"
            disabled={declining}
          >
            Discuss Booking
          </button>
          <button
            onClick={handleDeclineBooking}
            disabled={declining}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {declining ? 'Declining...' : 'Decline Booking'}
          </button>
        </FlexBox>
      ) : (
        /* Show status banner for all other cases */
        <ResponseBanner 
          responseType={booking?.response} 
          isRequester={isRequester}
          isReceiver={isReceiver}
          booking={booking}
        />
      )}
    </div>
  );
};

const ResponseBanner = ({ responseType, isRequester, isReceiver, booking }) => {
  // If booking is confirmed - show the success message
  if (responseType === "confirmed") {
    return (
      <div className='bg-green-900/30 border border-green-600/50 p-4 center flex-col pointer-events-none'>
        <FlexBox className="gap-3 items-center mb-3">
          <FaHandshake className="text-green-400 text-xl" />
          <Title text="Deal Confirmed! 🎉" size="md" className="text-green-400" />
        </FlexBox>
        <Paragraph 
          text="Congratulations! Both parties have confirmed the booking agreement. The deal is now official and binding."
          className="text-green-300 mb-2"
        />
        <SpanText
          text={`Confirmed on: ${new Date(booking?.confirmed_at).toLocaleDateString()}`}
          color="green-200"
          size="xs"
        />
      </div>
    )
  }

  // If booking is declined - show the declined message
  if (responseType === "declined") {
    return (
      <div className='bg-red-900/30 border border-red-600/50 p-4 center flex-col pointer-events-none'>
        <FlexBox className="gap-3 items-center mb-3">
          <FaTimes className="text-red-400 text-xl" />
          <Title text="Booking Declined" size="md" className="text-red-400" />
        </FlexBox>
        <Paragraph 
          text={
            isRequester 
              ? "Unfortunately, your booking request has been declined. You can try booking other available DJs."
              : "You have declined this booking request. The organizer has been notified."
          }
          className="text-red-300 mb-2"
        />
        <SpanText
          text={`Declined on: ${new Date(booking?.declined_at).toLocaleDateString()}`}
          color="red-200"
          size="xs"
        />
      </div>
    )
  }
  
  // Default to pending state (null response or "pending")
  return (
    <div className='bg-yellow-900/50 border border-yellow-600/50 p-4 center flex-col pointer-events-none'>
      <FlexBox className="gap-2 items-center mb-2">
        <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
        <Title text="Pending Booking" size="sm" className="text-yellow-400" />
      </FlexBox>
      <Paragraph 
        text={
          isRequester 
            ? "Your booking request is pending. Please wait for the DJ to respond. You'll be notified once they accept or decline your request."
            : "You have a pending booking request. Please review the details and respond to the organizer."
        }
        className="text-yellow-100"
      />
    </div>
  )
}

export default BookingActions