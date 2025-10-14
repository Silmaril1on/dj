import Motion from '@/app/components/containers/Motion';
import ArtistCountry from '@/app/components/materials/ArtistCountry';
import Location from '@/app/components/materials/Location';
import MyLink from '@/app/components/ui/MyLink';
import Paragraph from '@/app/components/ui/Paragraph';
import SpanText from '@/app/components/ui/SpanText';
import Title from '@/app/components/ui/Title';
import { capitalizeFirst, formatBirthdate } from '@/app/helpers/utils';
import { FaCalendar, FaLink } from 'react-icons/fa';

const BasicInfo = ({ event }) => {
  return (
    <>
      <Motion animation="pop" delay={0.4}>
        <MyLink
          icon={<FaLink />}
          text="Check Event"
          target="_blank"
          href={`${event.links}`}
        />
        <SpanText
          className="secondary"
          size="xs"
          color="cream"
          text={`Promoter: ${capitalizeFirst(event.promoter)}`}
        />
      </Motion>
      <div className="space-y-3">
        <Motion animation="fade" delaty={0.3} className="space-y-1">
          <Title size="xl" text={event.event_name} />
          <Paragraph text={event.description} />
        </Motion>
        <Motion animation="left" delay={1}>
          <ArtistCountry artistCountry={event} />
          <Location address={event.address} location_url={event.location_url} />
        </Motion>
      </div>
      <div className="overflow-hidden">
        <Motion animation="top" delay={0.7}>
          <SpanText
            icon={<FaCalendar />}
            color="cream"
            size="md"
            className="font-bold"
            text={`${formatBirthdate(event.date)}`}
          />
          <SpanText text={`Doors open: ${event.doors_open}`} />
        </Motion>
      </div>
    </>
  );
}

export default BasicInfo

