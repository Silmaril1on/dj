"use client"
import { useDispatch, useSelector } from 'react-redux'
import { openAcceptBookingModal } from '@/app/features/bookingSlice'
import { selectUser } from '@/app/features/userSlice'
import FlexBox from '@/app/components/containers/FlexBox';
import Title from '@/app/components/ui/Title';
import Paragraph from '@/app/components/ui/Paragraph';
import { FaHandshake } from 'react-icons/fa';
import SpanText from '@/app/components/ui/SpanText';

const BookingActions = ({ booking }) => {
  const dispatch = useDispatch()
  const currentUser = useSelector(selectUser)

  const handleAcceptBooking = () => {
    if (booking) {
      dispatch(openAcceptBookingModal(booking))
    }
  }

  const handleDeclineBooking = () => {
    console.log('Decline booking:', booking?.id)
  }

  // Determine if current user is the receiver (DJ owner) or requester
  const isReceiver = currentUser?.id === booking?.receiver_id
  const isRequester = currentUser?.id === booking?.requester_id

  return (
    <div className="bg-stone-950 mt-5 rounded-sm">
      {/* Show action buttons only for receiver AND when response is null */}
      {isReceiver && booking?.response === null ? (
        <FlexBox className="gap-4 *:duration-300 *:cursor-pointer">
          <button
            onClick={handleAcceptBooking}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-sm font-medium transition-colors"
          >
            Discuss Booking
          </button>
          <button
            onClick={handleDeclineBooking}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-sm font-medium transition-colors"
          >
            Decline Booking
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

  // If booking is declined
  if (responseType === "declined") {
    return (
      <div className='bg-red-900/50 border border-red-600/50 p-4 center flex-col pointer-events-none'>
        <FlexBox className="gap-2 items-center mb-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <Title text="Booking Declined" size="sm" className="text-red-400" />
        </FlexBox>
        <Paragraph 
          text={
            isRequester 
              ? "Unfortunately, your booking request has been declined. You can try booking other available DJs."
              : "You have declined this booking request. The organizer has been notified."
          }
          className="text-red-300"
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