"use client";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { setError } from "@/app/features/modalSlice";
import { updateUserProfile } from "@/app/features/userSlice";
import { revalidateProfile } from "@/app/lib/hooks/useUserProfile";
import SubmissionForm from "@/app/components/forms/SubmissionForm";
import Title from "@/app/components/ui/Title";
import { formConfigs } from "@/app/helpers/formData/formConfigs";
import FormContainer from "@/app/components/forms/FormContainer";

const UserProfileForm = ({ profile, error, onCancel }) => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);

  const formConfig = {
    ...formConfigs.userProfile,
    initialData: {
      userName: profile?.userName || "",
      first_name: profile?.first_name || "",
      last_name: profile?.last_name || "",
      birth_date: profile?.birth_date || "",
      sex: profile?.sex || "",
      address: profile?.address || "",
      country: profile?.country || "",
      city: profile?.city || "",
      state: profile?.state || "",
      zip_code: profile?.zip_code || "",
      user_avatar: profile?.user_avatar || profile?.avatar_url || "",
    },
  };

  const handleSubmit = async (formData) => {
    setIsLoading(true);
    dispatch(setError(""));
    try {
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }
      // Keep Redux global auth state in sync
      dispatch(updateUserProfile(data.profile));
      // Revalidate SWR cache — all useUserProfile hooks update instantly
      await revalidateProfile();
      dispatch(
        setError({ message: "Profile updated successfully!", type: "success" }),
      );
      if (onCancel) onCancel();
    } catch (err) {
      dispatch(setError({ message: err.message, type: "error" }));
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <Title text="Error Loading Profile" color="crimson" />
        <p className="text-gray-600 dark:text-gray-400 mt-2">{error}</p>
      </div>
    );
  }

  return (
    <FormContainer
      maxWidth="max-w-4xl"
      title="My Profile"
      description="Update your personal information and avatar"
    >
      <SubmissionForm
        formConfig={formConfig}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        submitButtonText="Update Profile"
        showGoogle={false}
      />
    </FormContainer>
  );
};

export default UserProfileForm;
