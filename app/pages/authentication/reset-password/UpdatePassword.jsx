"use client";
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { setError } from "@/app/features/modalSlice";
import { supabaseClient } from "@/app/lib/config/supabaseClient";
import FormContainer from "@/app/components/forms/FormContainer";
import SubmissionForm from "@/app/components/forms/SubmissionForm";
import { formConfigs } from "@/app/helpers/formData/formConfigs";

const validatePassword = ({ password, confirmPassword, dispatch }) => {
  if (password.length < 8) {
    dispatch(setError("Password must be at least 8 characters."));
    return false;
  }
  if (password !== confirmPassword) {
    dispatch(setError("Passwords do not match."));
    return false;
  }
  return true;
};

const UpdatePassword = () => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [sessionVerified, setSessionVerified] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const verifySession = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const access_token = hashParams.get("access_token");
      const type = hashParams.get("type");

      if (access_token && type === "recovery") {
        const { error } = await supabaseClient.auth.setSession({
          access_token,
          refresh_token: hashParams.get("refresh_token"),
        });

        if (error) {
          dispatch(setError("Invalid or expired reset link. Please request a new one."));
          router.push("/");
        } else {
          setSessionVerified(true);
        }
      } else {
        dispatch(setError("No valid session or recovery token found."));
        router.push("/");
      }
    };

    verifySession();
  }, [dispatch, router]);

  const handleSubmit = async (formData) => {
    if (!sessionVerified) {
      dispatch(setError("Please verify your session first"));
      return;
    }
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");
    if (!validatePassword({ password, confirmPassword, dispatch })) return;
    setIsLoading(true);
    try {
      const { data } = await supabaseClient.auth.getSession();
      const token = data?.session?.access_token;
      if (!token) {
        dispatch(setError("Session expired. Please request a new reset link."));
        return;
      }
      const res = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      });
      const result = await res.json();
      if (!res.ok) {
        dispatch(setError(result.error || "Failed to update password."));
      } else {
        dispatch(setError({
          message: "Password updated successfully! You are now signed in.",
          type: "success"
        }));
        router.push("/");
      }
    } catch {
      dispatch(setError("An unexpected error occurred."));
    } finally {
      setIsLoading(false);
    }
  };

  if (!sessionVerified) {
    return <div>Verifying your session...</div>;
  }

  return (
    <FormContainer
      title="Welcome Back"
      footerText="Remember password? "
      footerLinkText="Sign In"
      footerHref="/sign-in"
    >
      <SubmissionForm
        showGoogle={false}
        formConfig={formConfigs.updatePassword}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        submitButtonText="Update Password"
      />
    </FormContainer>
  );
};

export default UpdatePassword;
