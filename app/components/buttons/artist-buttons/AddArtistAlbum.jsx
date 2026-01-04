"use client";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectUser } from "@/app/features/userSlice";
import { setError, openAddAlbumModal } from "@/app/features/modalSlice";

const AddArtistAlbum = ({ className, artist, desc, userSubmittedArtistId }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if current user is admin or submitted this artist
  const canAddAlbum =
    user && (user.is_admin || userSubmittedArtistId === artist?.id);

  const handleAddAlbum = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      dispatch(
        setError({ message: "Please login to add albums", type: "error" })
      );
      return;
    }
    if (!canAddAlbum) {
      dispatch(
        setError({
          message: "You can only add albums for your own artist profile",
          type: "error",
        })
      );
      return;
    }
    dispatch(openAddAlbumModal({ artist }));
  };

  if (!mounted || !canAddAlbum) {
    return null;
  }

  return (
    <div
      onClick={handleAddAlbum}
      className={`bg-gold/30 hover:bg-gold/40 text-gold w-fit secondary center gap-1 cursor-pointer duration-300 p-1 rounded-xs text-sm font-bold ${className}`}
    >
      {desc && <h1>{desc}</h1>}
    </div>
  );
};

export default AddArtistAlbum;
