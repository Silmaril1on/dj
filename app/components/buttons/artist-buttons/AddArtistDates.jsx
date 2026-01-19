"use client";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "@/app/features/userSlice";
import { openAddEventModal } from "@/app/features/modalSlice";
import ModalActionButton from "./base/ModalActionButton";

const AddArtistDates = ({ className, artist, desc, userSubmittedArtistId }) => {
  const user = useSelector(selectUser);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const canAddEvent =
    user && (user.is_admin || userSubmittedArtistId === artist?.id);

  if (!mounted || !canAddEvent) {
    return null;
  }

  return (
    <ModalActionButton
      modalType="addEvent"
      modalAction={openAddEventModal}
      modalData={{ artist }}
      label={desc}
      authMessage="Please login to add events"
      requirePermission={(user) =>
        user.is_admin || userSubmittedArtistId === artist?.id
      }
      permissionMessage="You can only add events for your own artist profile"
      className={className}
    />
  );
};

export default AddArtistDates;
