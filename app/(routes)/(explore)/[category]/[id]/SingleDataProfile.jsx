"use client";
import useRecentlyViewed from "@/app/lib/hooks/useRecentlViewed";
import ArtistSchedule from "@/app/(routes)/artists/[slug]/(components)/ArtistSchedule";
import ProfileActions from "./(components)/ProfileActions";
import ProfileBasicInfo from "./(components)/ProfileBasicInfo";
import ProfilePoster from "./(components)/ProfilePoster";
import FestivalLineupDisplay from "./(components)/FestivalLineupDisplay";
import TicketsDisplay from "./(components)/FestivalTicketsDisplay";
import HowToGet from "./(components)/HowToGet";
import RelatedItems from "./(components)/RelatedItems";
import CountDown from "./(components)/CountDown";
import { PROFILE_TYPE_CONFIG, extractProfileData } from "./profileConfigs";

const SingleDataProfile = ({ data, type = "events", currentUserId = null }) => {
  if (!data) return null;

  const config = PROFILE_TYPE_CONFIG[type];
  const profileData = extractProfileData(data, type);

  const hasEventLineup =
    type === "events" &&
    Array.isArray(profileData.lineup) &&
    profileData.lineup.length > 0;
  const hasFestivalLineup = type === "festivals";
  const showLineupDisplay = hasFestivalLineup || hasEventLineup;
  const lineupProps = hasFestivalLineup
    ? { festivalId: profileData.id }
    : { eventArtists: profileData.lineup };

  // Track recently viewed id for user
  useRecentlyViewed(
    type === "clubs" ? "club" : type === "events" ? "event" : "festival",
    profileData.id,
  );

  return (
    <div className="flex flex-col pb-5">
      {/* Header with Lineup and Actions/Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 p-1 lg:p-4">
        <ProfileActions
          data={profileData}
          type={config.actionType}
          config={config}
          currentUserId={currentUserId}
        />
      </div>
      {/* Main Content: Info + Poster */}
      <div className="flex flex-col-reverse lg:flex-row">
        <ProfileBasicInfo data={profileData} type={type} />
        <ProfilePoster src={profileData.image} alt={profileData.name} />
      </div>
      {/* Schedule Section (for clubs) */}
      {config.hasSchedule && type === "clubs" && (
        <ArtistSchedule
          clubId={profileData.id}
          clubData={data}
          title={config.scheduleTitle}
          description={config.scheduleDescription}
        />
      )}
      {/* Festival/Event Lineup Display */}
      {showLineupDisplay && <FestivalLineupDisplay {...lineupProps} />}

      {(type === "festivals" || type === "events") && (
        <TicketsDisplay entityType={type} entityId={profileData.id} />
      )}

      {/* Countdown — festivals only */}
      {type === "festivals" && profileData.start_date && (
        <CountDown startDate={profileData.start_date} />
      )}

      {/* How to Get There — clubs, events, festivals */}
      {["clubs", "events", "festivals"].includes(type) && (
        <HowToGet data={profileData} type={type} />
      )}

      {/* Related items by country — clubs, events, festivals */}
      {["clubs", "events", "festivals"].includes(type) &&
        profileData.country && (
          <RelatedItems
            entityId={profileData.id}
            entityType={type}
            country={profileData.country}
          />
        )}
    </div>
  );
};

export default SingleDataProfile;
