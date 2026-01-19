"use client";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "@/app/features/userSlice";
import { openAddAlbumModal } from "@/app/features/modalSlice";
import ModalActionButton from "./base/ModalActionButton";

const AddArtistAlbum = ({ className, artist, desc, userSubmittedArtistId }) => {
  const user = useSelector(selectUser);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const canAddAlbum =
    user && (user.is_admin || userSubmittedArtistId === artist?.id);

  if (!mounted || !canAddAlbum) {
    return null;
  }

  return (
    <ModalActionButton
      modalType="addAlbum"
      modalAction={openAddAlbumModal}
      modalData={{ artist }}
      label={desc}
      authMessage="Please login to add albums"
      requirePermission={(user) =>
        user.is_admin || userSubmittedArtistId === artist?.id
      }
      permissionMessage="You can only add albums for your own artist profile"
      className={className}
    />
  );
};

export default AddArtistAlbum;
