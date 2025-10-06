import FlexBox from '@/app/components/containers/FlexBox'
import Paragraph from '@/app/components/ui/Paragraph'
import SpanText from '@/app/components/ui/SpanText'
import { formatTime } from '@/app/helpers/utils'
import ProfilePicture from '@/app/components/materials/ProfilePicture';
import Link from 'next/link';

const BookingContent = ({  bookingRequests }) => {

  return (
    <div className="space-y-2">
      {bookingRequests.map((request) => (
        <Link
          href="/bookings"
          key={request.id}
          className={`flex flex-col p-2 cursor-pointer duration-300 hover:bg-black bg-stone-900 space-y-2`}
        >
          <div className="flex items-start justify-between ">
            <ProfilePicture avatar_url={request.requester?.avatar} />
            <div className="flex-1 ml-2">
              <Paragraph
                text={`${request.event_name} booking offer`}
                className="uppercase"
              />
              <FlexBox type="row-between">
                <SpanText
                  size="xs"
                  className="capitalize"
                  text={`FROM: ${
                    request.requester?.full_name || request.requester?.userName
                  }`}
                />
                <SpanText
                  size="xs"
                  font="secondary"
                  text={formatTime(request.created_at)}
                />
              </FlexBox>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default BookingContent