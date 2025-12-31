"use client";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { setError } from "@/app/features/modalSlice";
import { formConfigs } from "@/app/helpers/formData/formConfigs";
import FormContainer from "@/app/components/forms/FormContainer";
import SubmissionForm from "@/app/components/forms/SubmissionForm";

const UploadFestivalPage = () => {
  const dispatch = useDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    dispatch(setError(""));

    try {
      const response = await fetch("/api/admin/upload-festival", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload festival");
      }

      dispatch(
        setError({
          message: "Festival uploaded successfully!",
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
        title="Upload Festival (Admin)"
        description="Upload a new festival directly to the platform. Festival will be automatically approved."
      >
        <SubmissionForm
          showGoogle={false}
          formConfig={formConfigs.addFestival}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
          submitButtonText="Upload Festival"
        />
      </FormContainer>
    </div>
  );
};

export default UploadFestivalPage;
