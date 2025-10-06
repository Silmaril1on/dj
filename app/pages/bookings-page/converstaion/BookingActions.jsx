"use client"
import { useDispatch } from 'react-redux'
import { openAcceptBookingModal } from '@/app/features/bookingSlice'
import FlexBox from '@/app/components/containers/FlexBox';
import Title from '@/app/components/ui/Title';
import Paragraph from '@/app/components/ui/Paragraph';

const BookingActions = ({ booking }) => {
    const dispatch = useDispatch()

  const handleAcceptBooking = () => {
    if (booking) {
      dispatch(openAcceptBookingModal(booking))
    }
  }

  const handleDeclineBooking = () => {
    console.log('Decline booking:', booking?.id)
  }


  return (
    <div className="bg-stone-950 mt-5 rounded-sm">
      {booking?.response === null ? (
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
        <ResponseBanner responseType={booking?.response} />
      )}
    </div>
  );
};

const ResponseBanner = ({ responseType }) => {
  if (responseType === "success") {
    return (
      <div className='bg-green-900/50 border border-green-600/50 p-4 center flex-col pointer-events-none'>
        <FlexBox className="gap-2 items-center mb-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <Title text="Booking Accepted!" size="sm" className="text-green-400" />
        </FlexBox>
        <Paragraph 
          text="Great! You've successfully accepted this booking request. The organizer has been notified and will contact you with further details." 
          className="text-green-300"
        />
      </div>
    )
  }
  
  // Default to pending state for any other response type
  return (
    <div className='bg-yellow-900/50 border border-yellow-600/50 p-4 center flex-col pointer-events-none'>
      <FlexBox className="gap-2 items-center mb-2">
        <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
        <Title text="Pending booking" size="sm" className="text-yellow-400" />
      </FlexBox>
      <Paragraph 
        text="You have a pending response for this booking request. Please check your messages for further details and updates." 
        className="text-yellow-100"
      />
    </div>
  )
}

export default BookingActions