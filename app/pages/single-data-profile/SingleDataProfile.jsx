"use client";
import useRecentlyViewed from "@/app/lib/hooks/useRecentlViewed";
import ArtistSchedule from "@/app/pages/artist/artist-profile/schedule/ArtistSchedule";
import ProfileLineup from "./components/ProfileLineup";
import ProfileActions from "./components/ProfileActions";
import ProfileBasicInfo from "./components/ProfileBasicInfo";
import ProfilePoster from "./components/ProfilePoster";
import ProfileOwnerControls from "./components/ProfileOwnerControls";
import FestivalLineupDisplay from "./components/FestivalLineupDisplay";
import { PROFILE_TYPE_CONFIG, extractProfileData } from "./profileConfigs";

const SingleDataProfile = ({ data, type = "events", currentUserId = null }) => {
  if (!data) return null;

  const config = PROFILE_TYPE_CONFIG[type];
  const profileData = extractProfileData(data, type);

  // Track recently viewed id for user
  useRecentlyViewed(
    type === "clubs" ? "club" : type === "events" ? "event" : "festival",
    profileData.id
  );

  console.log(data, "////");

  return (
    <div className="flex flex-col pb-5">
      {/* Header with Lineup and Actions/Controls */}
      <div className="flex flex-col lg:pl-2 lg:flex-row justify-between items-start lg:items-center gap-2 mb-3 lg:mb-0">
        <div className="lg:w-6xl lg:py-3 ">
          {config.hasLineup && profileData.lineup && (
            <ProfileLineup
              title={config.lineupTitle}
              data={profileData.lineup}
            />
          )}
        </div>
        {config.hasOwnerControls && (
          <ProfileOwnerControls
            data={profileData}
            type={type}
            currentUserId={currentUserId}
          />
        )}

        {config.hasActions && !config.hasOwnerControls && (
          <ProfileActions data={profileData} type={config.actionType} />
        )}
      </div>

      {/* Main Content: Info + Poster */}
      <div className={`flex flex-col-reverse lg:flex-row`}>
        <article
          className={`flex flex-1 justify-between items-start flex-col bg-stone-900 p-4`}
        >
          <ProfileBasicInfo data={profileData} type={type} />
        </article>
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
