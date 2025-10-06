"use client";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { setError } from "@/app/features/modalSlice";
import FormContainer from "@/app/components/forms/FormContainer";
import SubmissionForm from "@/app/components/forms/SubmissionForm";
import { useRouter } from "next/navigation";
import { formConfigs } from "@/app/helpers/formData/formConfigs";

const ResetPassword = () => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (formData) => {
    setIsLoading(true);
    try {
      const email = formData.get("email");
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        dispatch(setError(data.error || "Failed to send reset email."));
      } else {
        dispatch(setError({ message: "Password reset link sent to your email.", type: "success" }));
        router.push("/");
      }
    } catch {
      dispatch(setError("Failed to send reset email. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormContainer
      title="Welcome Back"
      footerText="Remember password? "
      footerLinkText="Sign In"
      footerHref="/sign-in"
    >
      <SubmissionForm
        showGoogle={false}
        formConfig={formConfigs.resetPassword}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        submitButtonText="Send Reset Link"
      />
    </FormContainer>
  );
};

export default ResetPassword;
