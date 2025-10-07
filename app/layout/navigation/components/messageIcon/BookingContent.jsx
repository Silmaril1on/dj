import FlexBox from '@/app/components/containers/FlexBox'
import Paragraph from '@/app/components/ui/Paragraph'
import SpanText from '@/app/components/ui/SpanText'
import { formatTime } from '@/app/helpers/utils'
import ProfilePicture from '@/app/components/materials/ProfilePicture';
import Link from 'next/link';

const BookingContent = ({ bookingRequests }) => {
  console.log("BookingContent - received data:", bookingRequests);

  if (!bookingRequests || bookingRequests.length === 0) {
    return (
      <div className="p-4">
        <Paragraph text="No booking requests found" />
      </div>
    );
  }

  const getStatusText = (request) => {
    if (request.user_role === 'requester') {
      // For requesters, show response status
      if (request.response === 'pending') return 'Response Received';
      if (request.response === 'success') return 'Accepted';
      if (request.response === 'declined') return 'Declined';
      return 'Pending Response';
    } else {
      // For receivers, show request status
      switch (request.status) {
        case "unopened": return "New";
        case "opened": return "Opened";
        case "seen": return "Seen";
        case "accepted": return "Accepted";
        case "declined": return "Declined";
        default: return "Unknown";
      }
    }
  };

  const getUserDisplayText = (request) => {
    const displayName = request.display_user?.full_name || 
                       request.display_user?.userName || 
                       'Unknown User';
    
    if (request.user_role === 'requester') {
      return `Booking request for ${displayName}`;
    } else {
      return `Booking request from ${displayName}`;
    }
  };

  return (
    <div className="space-y-2">
      {bookingRequests.map((request) => {
        console.log("Rendering request:", request);
        console.log("Display user:", request.display_user);
        
        return (
          <Link
            href="/bookings"
            key={request.id}
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
                    className="capitalize"
                    text={getUserDisplayText(request)}
                  />
                  <SpanText
                    size="xs"
                    color="cream"
                    text={formatTime(request.created_at)}
                  />
                </FlexBox>
                <SpanText
                  size="xs"
                  text={getStatusText(request)}
                  className={`
                    ${request.status === 'unopened' ? 'text-blue-400' :
                      request.status === 'opened' ? 'text-yellow-400' :
                      request.status === 'seen' ? 'text-purple-400' :
                      request.response === 'pending' ? 'text-yellow-400' :
                      request.response === 'success' ? 'text-green-400' :
                      'text-stone-400'
                    }
                  `}
                />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default BookingContent;