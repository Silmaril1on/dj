"use client";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  closeAddAlbumModal,
  selectAddAlbumModal,
} from "@/app/features/modalSlice";
import { showSuccess } from "@/app/features/successSlice";
import { setError } from "@/app/features/modalSlice";
import SubmissionForm from "@/app/components/forms/SubmissionForm";
import { formConfigs } from "@/app/helpers/formData/formConfigs";
import GlobalModal from "./GlobalModal";

const AddAlbumModal = () => {
  const dispatch = useDispatch();
  const { isOpen, artist, albumData, isEditMode } =
    useSelector(selectAddAlbumModal) || {};
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prepare form config with initial values for edit mode
  const albumFormConfig = {
    ...formConfigs.addArtistAlbum,
    initialData:
      isEditMode && albumData
        ? {
            name: albumData.name || "",
            release_date: albumData.release_date || "",
            description: albumData.description || "",
            tracklist: albumData.tracklist || [""],
            album_image: albumData.album_image || null,
          }
        : formConfigs.addArtistAlbum.initialData,
  };

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      formData.append("type", "artist_album");

      // If editing, include the album ID
      if (isEditMode && albumData?.id) {
        formData.append("album_id", albumData.id);
      }

      const response = await fetch(`/api/artists/${artist.id}`, {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add album");
      }

      const result = await response.json();
      console.log("API Response:", result);
      console.log("Album data:", result.data);
      console.log("Album image:", result.data?.album_image);
      console.log("Album name:", result.data?.name);

      const successData = {
        type: "artist_album",
        image: result.data?.album_image || "",
        album_image: result.data?.album_image || "",
        name: result.data?.name || "",
        isEdit: isEditMode,
      };
      console.log("Dispatching showSuccess with:", successData);

      dispatch(showSuccess(successData));
      dispatch(closeAddAlbumModal());

      // Don't reload immediately - let user see the success modal
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("Error adding album:", error);
      dispatch(setError({ message: error.message, type: "error" }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    dispatch(closeAddAlbumModal());
  };

  if (!isOpen) return null;

  return (
    <GlobalModal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditMode ? "Edit Album" : "Add Album"}
      maxWidth="max-w-2xl"
    >
      <SubmissionForm
        formConfig={albumFormConfig}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
        submitButtonText={isEditMode ? "Update Album" : "Add Album"}
        showGoogle={false}
      />
    </GlobalModal>
  );
};

export default AddAlbumModal;
