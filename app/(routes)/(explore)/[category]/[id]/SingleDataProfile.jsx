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
import { MdEdit, MdOutlineFileUpload } from "react-icons/md";

const OWNER_BUTTONS = {
  clubs: [
    {
      icon: <MdEdit />,
      title: "Edit Club Info",
      action: (data, router) =>
        router.push(`/add-product/club?edit=true&clubId=${data.id}`),
    },
    {
      icon: <MdOutlineFileUpload />,
      title: "Add Event",
      action: (data, _router, dispatch) =>
        dispatch(openAddClubDateModal({ club: data })),
    },
  ],
  festivals: [
    {
      icon: <MdEdit />,
      title: "Edit Festival Info",
      action: (data, router) =>
        router.push(`/add-product/festival?edit=true&festivalId=${data.id}`),
    },
    {
      icon: <MdOutlineFileUpload />,
      title: "Add Lineup",
      action: (data, router) => router.push(`/festivals/${data.id}/add-lineup`),
    },
  ],
};

const ProfileOwnerControls = ({ data, type, currentUserId }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  const canManage =
    (currentUserId && data.user_id === currentUserId) || user?.is_admin;
  const buttons = OWNER_BUTTONS[type];

  if (!canManage || !buttons) return null;

  return (
    <div className="flex justify-between items-center absolute top-2 gap-2 right-2">
      {buttons.map(({ icon, title, action }) => (
        <ActionButton
          key={title}
          icon={icon}
          title={title}
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
      <div className="flex flex-col lg:pl-2 lg:flex-row justify-between items-start lg:items-center gap-2 mb-3 lg:mb-0">
        {config.hasLineup && profileData.lineup && (
          <div className="lg:w-6xl lg:py-3">
            <ProfileLineup
              title={config.lineupTitle}
              data={profileData.lineup}
            />
          </div>
        )}
        {config.hasActions && !config.hasOwnerControls && (
          <ProfileActions data={profileData} type={config.actionType} />
        )}
      </div>

      {/* Main Content: Info + Poster */}
      <div className={`flex flex-col-reverse lg:flex-row`}>
        <article className="flex flex-1 relative justify-between items-start flex-col bg-stone-900 p-4">
          <ProfileBasicInfo data={profileData} type={type} />
          {config.hasOwnerControls && (
            <ProfileOwnerControls
              data={profileData}
              type={type}
              currentUserId={currentUserId}
            />
          )}
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
