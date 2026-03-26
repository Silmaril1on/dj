"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { selectUser } from "@/app/features/userSlice";
import { openAddClubDateModal } from "@/app/features/modalSlice";
import Motion from "@/app/components/containers/Motion";
import SpanText from "@/app/components/ui/SpanText";
import ActionButton from "@/app/components/buttons/ActionButton";
import { FaUsers } from "react-icons/fa";
import { MdEdit, MdAdd, MdPlaylistAdd } from "react-icons/md";
import { MdConfirmationNumber } from "react-icons/md";
import LikeButton from "@/app/components/buttons/artist-buttons/LikeButton";
import ReminderButton from "@/app/components/buttons/artist-buttons/ReminderButton";
import FestivalTicketsModal from "./FestivalTicketsModal";

const OWNER_BUTTONS = {
  events: [
    {
      title: "Edit Event",
      Icon: MdEdit,
      action: (data, router) =>
        router.push(`/add-product/event?edit=true&eventId=${data.id}`),
    },
  ],
  clubs: [
    {
      title: "Edit Info",
      Icon: MdEdit,
      action: (data, router) =>
        router.push(`/add-product/club?edit=true&clubId=${data.slug}`),
    },
    {
      title: "Add Event",
      Icon: MdAdd,
      action: (data, _router, dispatch) =>
        dispatch(openAddClubDateModal({ club: data })),
    },
  ],
  festivals: [
    {
      title: "Edit Info",
      Icon: MdEdit,
      action: (data, router) =>
        router.push(`/add-product/festival?edit=true&festivalId=${data.slug}`),
    },
    {
      title: "Add Lineup",
      Icon: MdPlaylistAdd,
      action: (data, router) =>
        router.push(`/festivals/${data.slug}/add-lineup`),
    },
  ],
};

const ProfileActions = ({ data, type, config, currentUserId = null }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  const [likesCount, setLikesCount] = useState(data.likesCount || 0);
  const [isLiked, setIsLiked] = useState(data.userLiked || false);
  const [isReminderSet, setIsReminderSet] = useState(
    data.userReminderSet || false,
  );
  const [reminderOffsetDays, setReminderOffsetDays] = useState(
    data.userReminderOffsetDays || 3,
  );
  const [isTicketsModalOpen, setIsTicketsModalOpen] = useState(false);

  if (!config?.hasActions) return null;

  // Resolve owner buttons
  const entityType =
    type === "event"
      ? "events"
      : type === "club"
        ? "clubs"
        : type === "festival"
          ? "festivals"
          : null;

  const isEventOwner =
    entityType === "events" &&
    Array.isArray(user?.submitted_event_id) &&
    user.submitted_event_id.includes(data.id);

  const canManage =
    isEventOwner ||
    (currentUserId && data.user_id === currentUserId) ||
    user?.is_admin;

  const ownerButtons =
    canManage && entityType ? OWNER_BUTTONS[entityType] : null;

  const handleLikeChange = (liked, newLikesCount) => {
    setIsLiked(liked);
    setLikesCount(newLikesCount);
  };

  return (
    <Motion
      animation="pop"
      className="pl-2 lg:px-4 flex gap-4 items-center flex-wrap"
    >
      {/* Owner action buttons */}
      {ownerButtons?.map(({ Icon, title, action }) => (
        <div key={title} className="center space-x-2">
          <SpanText
            text={title}
            size="xs"
            className="secondary pointer-events-none"
          />
          <ActionButton
            icon={<Icon size={16} />}
            onClick={() => action(data, router, dispatch)}
          />
        </div>
      ))}

      {canManage && entityType === "festivals" && (
        <div className="center space-x-2">
          <SpanText
            text="Ticket info"
            size="xs"
            className="secondary pointer-events-none"
          />
          <ActionButton
            icon={<MdConfirmationNumber size={16} />}
            onClick={() => setIsTicketsModalOpen(true)}
          />
        </div>
      )}

      {/* Like / Followers */}
      <div className="center space-x-2">
        <SpanText
          icon={<FaUsers size={15} />}
          size="xs"
          text={`${likesCount} ${type === "event" ? "Interested" : "Followers"}`}
          className="ml-2 secondary pointer-events-none"
        />
        <LikeButton
          type={type}
          size={16}
          artist={{ id: data.id, isLiked, likesCount }}
          onLikeChange={handleLikeChange}
        />
      </div>

      {/* Reminder (events only) */}
      {type === "event" && (
        <div className="flex justify-end space-x-2">
          <SpanText
            text="Set reminder"
            size="xs"
            className="secondary pointer-events-none"
          />
          <ReminderButton
            size={16}
            event={{ id: data.id, isReminderSet, reminderOffsetDays }}
            onReminderChange={(nextState, nextOffset) => {
              setIsReminderSet(nextState);
              if (nextOffset) setReminderOffsetDays(nextOffset);
            }}
          />
        </div>
      )}

      {entityType === "festivals" && (
        <FestivalTicketsModal
          isOpen={isTicketsModalOpen}
          onClose={() => setIsTicketsModalOpen(false)}
          festivalId={data.id}
          onSaved={() => window.location.reload()}
        />
      )}
    </Motion>
  );
};

export default ProfileActions;
