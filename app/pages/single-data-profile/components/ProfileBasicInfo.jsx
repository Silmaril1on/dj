import Motion from '@/app/components/containers/Motion';
import ArtistCountry from '@/app/components/materials/ArtistCountry';
import Location from '@/app/components/materials/Location';
import MyLink from '@/app/components/ui/MyLink';
import Paragraph from '@/app/components/ui/Paragraph';
import SpanText from '@/app/components/ui/SpanText';
import Title from '@/app/components/ui/Title';
import { capitalizeFirst, formatBirthdate } from '@/app/helpers/utils';
import { FaCalendar, FaLink, FaGlobe } from 'react-icons/fa';
import EmailTag from '@/app/components/ui/EmailTag';
import SocialLinks from '@/app/components/materials/SocialLinks';

const ProfileBasicInfo = ({ data, type }) => {
  const renderEventInfo = () => (
    <>
      <Motion animation="pop" delay={0.4}>
        {data.links && (
          <MyLink
            icon={<FaLink />}
            text="Check Event"
            target="_blank"
            href={data.links}
          />
        )}
        {data.promoter && (
          <SpanText
            className="secondary"
            size="xs"
            color="cream"
            text={`Promoter: ${capitalizeFirst(data.promoter)}`}
          />
        )}
      </Motion>
      <div className="space-y-3 py-5">
        <Motion animation="fade" delay={0.3} className="space-y-1">
          <Title size="xl" text={data.name} />
          <Paragraph text={data.description} />
        </Motion>
        <Motion animation="left" delay={1}>
          <ArtistCountry artistCountry={data} />
          <Location address={data.address} location_url={data.location_url} />
        </Motion>
      </div>
      <div className="overflow-hidden">
        <Motion animation="top" delay={0.7}>
          <SpanText
            icon={<FaCalendar />}
            color="cream"
            size="md"
            className="font-bold"
            text={formatBirthdate(data.date)}
          />
          {data.doors_open && (
            <SpanText text={`Doors open: ${data.doors_open}`} />
          )}
        </Motion>
      </div>
    </>
  );

  const renderClubInfo = () => (
    <>
      <div>
        <Title size="xl" text={data.name} />
        <ArtistCountry artistCountry={data} />
      </div>
      <Paragraph text={data.description} />
      <div>
        <Location address={data.address} location_url={data.location_url} />
        {data.email && <EmailTag email={data.email} />}
      </div>
      <div>
        <SocialLinks
          animation={true}
          animationDelay={1.2}
          social_links={data.social_links}
        />
      </div>
      {data.capacity && (
        <div className="mt-4 text-xs text-stone-400">
          Capacity: <span className="text-gold">{data.capacity}</span>
        </div>
      )}
    </>
  );

  const renderFestivalInfo = () => (
    <>
      <div>
        <Title size="xl" text={data.name} />
        <ArtistCountry artistCountry={data} />
      </div>
      <div className="space-y-3 py-5">
        {data.website && (
          <Motion animation="pop" delay={0.4}>
            <MyLink
              icon={<FaGlobe />}
              text="Official Website"
              target="_blank"
              href={data.website}
            />
          </Motion>
        )}
        <Motion animation="fade" delay={0.3} className="space-y-1">
          <Paragraph text={data.description} />
        </Motion>
        <Motion animation="left" delay={1}>
          <Location address={data.address} location_url={data.location_url || data.location} />
        </Motion>
      </div>
      {(data.start_date || data.end_date) && (
        <div className="overflow-hidden">
          <Motion animation="top" delay={0.7}>
            <SpanText
              icon={<FaCalendar />}
              color="cream"
              size="md"
              className="font-bold"
              text={`${formatBirthdate(data.start_date)} - ${formatBirthdate(data.end_date)}`}
            />
          </Motion>
        </div>
      )}
      <div>
        <SocialLinks
          animation={true}
          animationDelay={1.2}
          social_links={data.social_links}
        />
      </div>
      {(data.capacity_total || data.capacity_per_day || data.capacity) && (
        <div className="mt-4 text-xs text-stone-400 space-y-1">
          {data.capacity_total && (
            <div>
              Capacity Total: <span className="text-gold">{parseInt(data.capacity_total).toLocaleString()}</span>
            </div>
          )}
          {data.capacity_per_day && (
            <div>
              Capacity Per Day: <span className="text-gold">{parseInt(data.capacity_per_day).toLocaleString()}</span>
            </div>
          )}
          {!data.capacity_total && !data.capacity_per_day && data.capacity && (
            <div>
              Capacity: <span className="text-gold">{data.capacity}</span>
            </div>
          )}
        </div>
      )}
    </>
  );

  const contentMap = {
    events: renderEventInfo,
    clubs: renderClubInfo,
    festivals: renderFestivalInfo,
  };

  return contentMap[type] ? contentMap[type]() : null;
};

export default ProfileBasicInfo;
