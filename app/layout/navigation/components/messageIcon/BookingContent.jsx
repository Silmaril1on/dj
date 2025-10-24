import FlexBox from '@/app/components/containers/FlexBox'
import Paragraph from '@/app/components/ui/Paragraph'
import SpanText from '@/app/components/ui/SpanText'
import { formatTime } from '@/app/helpers/utils'
import ProfilePicture from '@/app/components/materials/ProfilePicture';
import Link from 'next/link';

const BookingContent = ({ bookingRequests, onClose }) => {

  if (!bookingRequests || bookingRequests.length === 0) {
    return (
      <div className="p-4 bg-stone-900 m-2 center pointer-events-none">
        <Paragraph text="No booking requests found yet" />
      </div>
    );
  }

  const getUserDisplayText = (request) => {
    // Check if booking is confirmed
    if (request.response === "confirmed") {
      return "Booking confirmed";
    }
    
    // Check if booking is declined
    if (request.response === "declined") {
      return "Booking was declined";
    }

    const displayName = request.display_user?.userName || 
                       request.display_user?.full_name || 
                       'Unknown User';
    
    if (request.user_role === 'requester') {
      return `Booking request for ${displayName}`;
    } else {
      return `Booking request from ${displayName}`;
    }
  };

  const getStatusStyle = (request) => {
    if (request.response === "confirmed") {
      return "text-green-500";
    }
    if (request.response === "declined") {
      return "text-red-500";
    }
    return ""; // Default styling for pending/null
  };

  return (
    <div className="space-y-2">
      {bookingRequests.map((request) => {
        return (
          <Link
            href="/bookings"
            key={request.id}
            onClick={onClose}
            className="flex flex-col p-2 cursor-pointer duration-300 hover:bg-black bg-stone-900 space-y-2"
          >
            <div className="flex items-center justify-between">
              <ProfilePicture 
                avatar_url={request.display_user?.avatar} 
                size="sm"
              />
              <div className="flex-1 ml-2">
                <Paragraph
                  text={`${request.event_name || 'Unknown Event'} booking offer`}
                  className="uppercase"
                />
                <FlexBox type="row-between">
                  <SpanText
                    size="xs"
                    className={`capitalize ${getStatusStyle(request)}`}
                    text={getUserDisplayText(request)}
                  />
                  <SpanText
                    size="xs"
                    color="cream"
                    text={formatTime(request.created_at)}
                  />
                </FlexBox>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default BookingContent;