"use client";
import useRecentlyViewed from "@/app/lib/hooks/useRecentlViewed";
import ArtistSchedule from "@/app/(routes)/artists/[slug]/(components)/ArtistSchedule";
import ProfileLineup from "./(components)/ProfileLineup";
import ProfileActions from "./(components)/ProfileActions";
import ProfileBasicInfo from "./(components)/ProfileBasicInfo";
import ProfilePoster from "./(components)/ProfilePoster";
import FestivalLineupDisplay from "./(components)/FestivalLineupDisplay";
import ActionButton from "@/app/components/buttons/ActionButton";
import { PROFILE_TYPE_CONFIG, extractProfileData } from "./profileConfigs";
import { useDispatch, useSelector } from "react-redux";
import { selectUser } from "@/app/features/userSlice";
import { useRouter } from "next/navigation";
import { openAddClubDateModal } from "@/app/features/modalSlice";

const OWNER_BUTTONS = {
  events: [
    {
      title: "Edit Event",
      action: (data, router) =>
        router.push(`/add-product/event?edit=true&eventId=${data.id}`),
    },
  ],
  clubs: [
    {
      title: "Edit Info",
      action: (data, router) =>
        router.push(`/add-product/club?edit=true&clubId=${data.slug}`),
    },
    {
      title: "Add Event",
      action: (data, _router, dispatch) =>
        dispatch(openAddClubDateModal({ club: data })),
    },
  ],
  festivals: [
    {
      title: "Edit Info",
      action: (data, router) =>
        router.push(`/add-product/festival?edit=true&festivalId=${data.slug}`),
    },
    {
      title: "Add Lineup",
      action: (data, router) =>
        router.push(`/festivals/${data.slug}/add-lineup`),
    },
  ],
};

const ProfileOwnerControls = ({ data, type, currentUserId, config }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  if (!config?.hasOwnerControls) return null;

  const isEventOwner =
    type === "events" &&
    Array.isArray(user?.submitted_event_id) &&
    user.submitted_event_id.includes(data.id);

  const canManage =
    isEventOwner ||
    (currentUserId && data.user_id === currentUserId) ||
    user?.is_admin;
  const buttons = OWNER_BUTTONS[type];

  if (!canManage || !buttons) return null;

  return (
    <div className="flex justify-between items-center gap-2 ">
      {buttons.map(({ icon, title, action }) => (
        <ActionButton
          key={title}
          icon={icon}
          text={title}
          onClick={() => action(data, router, dispatch)}
        />
      ))}
    </div>
  );
};

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
        <div className="flex">
          <ProfileOwnerControls
            data={profileData}
            type={type}
            currentUserId={currentUserId}
            config={config}
          />
          <ProfileActions
            data={profileData}
            type={config.actionType}
            config={config}
          />
        </div>
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
