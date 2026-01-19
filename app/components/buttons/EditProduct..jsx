"use client";
import { useState, useEffect } from "react";
import { MdEdit } from "react-icons/md";
import { useSelector } from "react-redux";
import { selectUser } from "@/app/features/userSlice";
import NavigationActionButton from "./artist-buttons/base/NavigationActionButton";

const EditProduct = ({ className, data, type, desc }) => {
  const user = useSelector(selectUser);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const canEdit =
    type === "artist"
      ? user && (user.is_admin || user.submitted_artist_id === data?.id)
      : type === "event"
        ? user &&
          (user.is_admin ||
            (Array.isArray(user.submitted_event_id) &&
              user.submitted_event_id.includes(data?.id)))
        : type === "club"
          ? user &&
            (user.is_admin ||
              user.submitted_club_id === data?.id ||
              (Array.isArray(user.submitted_club_id) &&
                user.submitted_club_id.includes(data?.id)))
          : type === "festival"
            ? user && (user.is_admin || user.submitted_festival_id === data?.id)
            : user && (user.is_admin || user.submitted_artist_id === data?.id);

  if (!canEdit || !mounted) {
    return null;
  }

  const getEditPath = () => {
    if (type === "artist")
      return `/add-product/add-artist?edit=true&artistId=${data.id}`;
    if (type === "event")
      return `/add-product/add-event?edit=true&eventId=${data.id}`;
    if (type === "club")
      return `/add-product/add-club?edit=true&clubId=${data.id}`;
    if (type === "festival")
      return `/add-product/add-festival?edit=true&festivalId=${data.id}`;
    return `/add-product/add-artist?edit=true&artistId=${data.id}`;
  };

  const buttonClassName = type === "artist" ? className : `${className}`;

  return (
    <NavigationActionButton
      href={getEditPath()}
      icon={<MdEdit size={20} />}
      label={type !== "artist" ? desc : null}
      authMessage={`Please login to edit this ${type}`}
      requirePermission={() => canEdit}
      permissionMessage={`You can only edit your own submitted ${type}`}
      variant={type === "artist" ? "rounded" : "default"}
      className={buttonClassName}
    />
  );
};

export default EditProduct;
