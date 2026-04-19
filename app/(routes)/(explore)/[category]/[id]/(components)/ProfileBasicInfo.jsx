import Motion from "@/app/components/containers/Motion";
import ArtistCountry from "@/app/components/materials/ArtistCountry";
import Location from "@/app/components/materials/Location";
import MyLink from "@/app/components/ui/MyLink";
import Paragraph from "@/app/components/ui/Paragraph";
import SpanText from "@/app/components/ui/SpanText";
import Title from "@/app/components/ui/Title";
import { capitalizeFirst, formatBirthdate } from "@/app/helpers/utils";
import { FaCalendar, FaLink } from "react-icons/fa";
import EmailTag from "@/app/components/ui/EmailTag";
import SocialLinks from "@/app/components/materials/SocialLinks";

const ProfileBasicInfo = ({ data, type }) => {
  const isEvent = type === "events";
  const isFestival = type === "festivals";

  const safeFormatDate = (dateValue) => {
    if (!dateValue) return null;
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return null;
    return formatBirthdate(dateValue);
  };

  const getDateText = () => {
    if (isEvent) {
      return safeFormatDate(data.date);
    }

    if (isFestival) {
      const start = safeFormatDate(data.start_date);
      const end = safeFormatDate(data.end_date);
      if (start && end) return `${start} - ${end}`;
      return start || end;
    }

    return null;
  };

  const formatCapacityValue = (value) => {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      return numeric.toLocaleString();
    }
    return value;
  };

  const getCapacityRows = () => {
    const rows = [];

    if (data.capacity_total) {
      rows.push({ label: "Capacity Total", value: data.capacity_total });
    }

    if (data.capacity_per_day) {
      rows.push({ label: "Capacity Per Day", value: data.capacity_per_day });
    }

    if (!rows.length && data.capacity) {
      rows.push({ label: "Capacity", value: data.capacity });
    }

    return rows;
  };

  const locationUrl = data.location_url;
  const email = data.email || data.venue_email;
  const dateText = getDateText();
  const capacityRows = getCapacityRows();
  const title = data.name || data.event_name;

  const socialLinks = [
    ...(Array.isArray(data.social_links) ? data.social_links : []),
    ...(isFestival && data.website ? [data.website] : []),
  ].filter(Boolean);

  return (
    <div className="flex  flex-1 relative justify-between items-start flex-col bg-stone-900 p-4">
      {isEvent && data.links && (
        <Motion animation="pop" delay={0.2} className="mb-3">
          <MyLink
            icon={<FaLink />}
            text="Check Event"
            target="_blank"
            href={data.links}
          />
        </Motion>
      )}

      <Motion animation="fade" delay={0.3} className="space-y-1 w-full">
        <Title size="xl" text={title} className="text-start leading-6" />
      </Motion>

      <Motion animation="left" delay={0.5} className="w-full py-3">
        <ArtistCountry artistCountry={data} />
        <Location address={data.address} location_url={locationUrl} />
        {email && <EmailTag email={email} />}
      </Motion>

      {data.description && (
        <Motion animation="fade" delay={0.6} className="w-full pb-4">
          <Paragraph text={data.description} className="lg:pr-[15%]" />
        </Motion>
      )}

      {isEvent && data.promoter && (
        <Motion animation="fade" delay={0.65} className="w-full pb-2">
          <SpanText
            className="secondary"
            size="xs"
            color="cream"
            text={`Promoter: ${capitalizeFirst(data.promoter)}`}
          />
        </Motion>
      )}

      {dateText && (
        <Motion animation="top" delay={0.7} className="w-full pb-2">
          <SpanText
            icon={<FaCalendar />}
            color="cream"
            size="md"
            className="font-bold"
            text={dateText}
          />
          {isEvent && data.doors_open && (
            <SpanText
              text={`Doors open: ${data.doors_open}`}
              className="uppercase"
            />
          )}
        </Motion>
      )}

      {capacityRows.length > 0 && (
        <Motion
          animation="fade"
          delay={0.8}
          className="mt-2 w-full text-xs text-stone-400 space-y-1 leading-none"
        >
          {capacityRows.map((row) => (
            <div key={row.label}>
              {row.label}:{" "}
              <span className="text-gold">
                {formatCapacityValue(row.value)}
              </span>
            </div>
          ))}
        </Motion>
      )}

      {socialLinks.length > 0 && (
        <Motion animation="fade" delay={0.9} className="mt-4">
          <SocialLinks
            animation={true}
            animationDelay={1}
            social_links={socialLinks}
          />
        </Motion>
      )}
    </div>
  );
};

export default ProfileBasicInfo;
