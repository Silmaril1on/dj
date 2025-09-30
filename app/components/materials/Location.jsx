import Link from "next/link";
import SpanText from "@/app/components/ui/SpanText";
import { MdLocationPin } from "react-icons/md";

const Location = ({ address, location_url, className = "" }) => {
  if (!address) return null;
  return (
    <div className={className}>
      {location_url ? (
        <Link href={location_url} target="_blank" rel="noopener noreferrer">
          <SpanText
            icon={<MdLocationPin />}
            className="secondary font-normal"
            color="cream"
            size="xs"
            text={address}
          />
        </Link>
      ) : (
        <SpanText
          icon={<MdLocationPin />}
          className="secondary font-normal"
          color="cream"
          size="xs"
          text={address}
        />
      )}
    </div>
  );
};

export default Location;