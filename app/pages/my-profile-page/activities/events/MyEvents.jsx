import EditButton from '@/app/components/buttons/EditProduct.';
import FlexBox from '@/app/components/containers/FlexBox';
import Motion from '@/app/components/containers/Motion';
import ArtistCountry from '@/app/components/materials/ArtistCountry';
import Dot from '@/app/components/ui/Dot';
import ErrorCode from '@/app/components/ui/ErrorCode';
import Paragraph from '@/app/components/ui/Paragraph';
import SpanText from '@/app/components/ui/SpanText';
import Title from '@/app/components/ui/Title';
import { formatBirthdate, truncateString } from '@/app/helpers/utils';

const MyEvents = ({ events = [] }) => {

  if (events.length === 0 || !events) {
   return (
     <div className=" bg-stone-900 center w-full h-full p-8 text-center">
       <ErrorCode
         title="No Submitted events"
         description="Are you a promoter? submitted events will be appear here"
       />
     </div>
   );
 }

  return (
      <div className="grid grid-cols-1 gap-3">
        {events.map((event) => (
          <Motion
            animation="fade"
            key={event.id}
            className="bg-stone-900 bordered flex p-3 gap-3 relative"
          >
            <div className="w-64 h-44">
              <img
                src={event.event_image}
                alt={event.event_name}
                className="w-full h-full object-cover"
              />
            </div>
            <article className=" w-full items-start flex flex-col">
              <div className="flex justify-between w-full">
                <Title text={event.event_name} />
              </div>
              <EditButton className="absolute top-3 right-3" data={event} type="event" />
              <ArtistCountry artistCountry={event} />
              <SpanText text={formatBirthdate(event.date)} />
              <Paragraph text={truncateString(event.description, 400)} />
              <FlexBox
                type="row-start"
                className="flex-wrap gap-2 items-center"
              >
                {event.artists.map((artist, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Title
                      size="xs"
                      color="cream"
                      className="uppercase"
                      text={artist}
                    />
                    {index < event.artists.length - 1 && <Dot />}
                  </div>
                ))}
              </FlexBox>
            </article>
          </Motion>
        ))}
      </div>
  );
};

export default MyEvents;