"use client";
import useRecentlyViewed from "@/app/lib/hooks/useRecentlViewed";
import ArtistSchedule from "@/app/(routes)/artists/[slug]/(components)/ArtistSchedule";
import ProfileLineup from "./(components)/ProfileLineup";
import ProfileActions from "./(components)/ProfileActions";
import ProfileBasicInfo from "./(components)/ProfileBasicInfo";
import ProfilePoster from "./(components)/ProfilePoster";
import FestivalLineupDisplay from "./(components)/FestivalLineupDisplay";
import { PROFILE_TYPE_CONFIG, extractProfileData } from "./profileConfigs";

const SingleDataProfile = ({ data, type = "events", currentUserId = null }) => {
  if (!data) return null;

  const config = PROFILE_TYPE_CONFIG[type];
  const profileData = extractProfileData(data, type);

  // Track recently viewed id for user
  useRecentlyViewed(
    type === "clubs" ? "club" : type === "events" ? "event" : "festival",
    profileData.id,
  );

  console.log(data, "Data from Events, Clubs, Festivals Page");

  return (
    <div className="flex flex-col pb-5">
      {/* Header with Lineup and Actions/Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 p-2 lg:p-4">
        <ProfileLineup title={config.lineupTitle} data={profileData.lineup} />
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
      {/* Festival Lineup Display */}
      {type === "festivals" && (
        <FestivalLineupDisplay festivalId={profileData.id} />
      )}
    </div>
  );
};

export default SingleDataProfile;
