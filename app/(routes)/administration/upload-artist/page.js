"use client";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { setError } from "@/app/features/modalSlice";
import { formConfigs } from "@/app/helpers/formData/formConfigs";
import FormContainer from "@/app/components/forms/FormContainer";
import SubmissionForm from "@/app/components/forms/SubmissionForm";

const UploadArtistPage = () => {
  const dispatch = useDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    dispatch(setError(""));

    try {
      formData.append("include_album", "false");

      const response = await fetch("/api/admin/upload-full-artist", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload artist");
      }

      dispatch(
        setError({
          message: "Artist uploaded successfully!",
          type: "success",
        })
      );

      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      dispatch(setError({ message: err.message, type: "error" }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <FormContainer
        maxWidth="w-full"
        title="Upload Artist (Admin)"
        description="Upload a new artist directly to the platform. Artist will be automatically approved."
      >
        <SubmissionForm
          showGoogle={false}
          formConfig={formConfigs.addArtist}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
          submitButtonText="Upload Artist"
        />
      </FormContainer>
    </div>
  );
};

export default UploadArtistPage;
