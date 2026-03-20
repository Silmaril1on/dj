"use client";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectUser, updateUserProfile } from "@/app/features/userSlice";
import { setError } from "@/app/features/modalSlice";
import { motion } from "framer-motion";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaEnvelope,
} from "react-icons/fa";
import GlobalModal from "./GlobalModal";
import SubmissionForm from "@/app/components/forms/SubmissionForm";
import Button from "@/app/components/buttons/Button";
import { userSexOptions } from "@/app/helpers/formData/sexOptions";

// All items that must be completed — each counts equally toward progress
const REQUIRED_PROFILE_FIELDS = [
  "user_avatar",
  "first_name",
  "last_name",
  "address",
  "birth_date",
  "sex",
  "country",
  "city",
];

const TOTAL_STEPS = REQUIRED_PROFILE_FIELDS.length + 1; // +1 for email_verified

function computeProgress(user, emailVerified) {
  const filledProfile = REQUIRED_PROFILE_FIELDS.filter(
    (f) => user && !!user[f],
  ).length;
  const filledEmail = emailVerified ? 1 : 0;
  return Math.round(((filledProfile + filledEmail) / TOTAL_STEPS) * 100);
}

const UserVerificationModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  const [stage, setStage] = useState(1);
  const [profileLoading, setProfileLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      if (user.profile_verified) setStage(2);
    }
  }, [user, isOpen]);

  const progress = computeProgress(user, user?.email_verified);
  const isFullyVerified = !!(user?.profile_verified && user?.email_verified);

  const profileFormConfig = {
    initialData: {
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      birth_date: user?.birth_date || "",
      sex: user?.sex || "",
      address: user?.address || "",
      country: user?.country || "",
      city: user?.city || "",
      state: user?.state || "",
      zip_code: user?.zip_code || "",
      profession: user?.profession || "",
      user_avatar: user?.user_avatar || "",
    },
    imageField: "user_avatar",
    fields: {
      user_avatar: {
        type: "image",
        required: false,
        label: "Profile Picture",
        helpText: "Upload your profile picture (max 1MB).",
      },
      first_name: {
        type: "text",
        required: true,
        label: "First Name",
        placeholder: "First name",
      },
      last_name: {
        type: "text",
        required: true,
        label: "Last Name",
        placeholder: "Last name",
      },
      profession: {
        type: "text",
        required: false,
        label: "Profession",
        placeholder: "e.g. DJ, Producer, Promoter",
      },
      address: {
        type: "text",
        required: true,
        label: "Address",
        placeholder: "Street address",
      },
      birth_date: {
        type: "date",
        required: true,
        label: "Birth Date",
      },
      sex: {
        type: "select",
        required: true,
        label: "Sex",
        options: userSexOptions,
      },
      country: {
        type: "text",
        required: true,
        label: "Country",
        placeholder: "Country",
      },
      city: {
        type: "text",
        required: true,
        label: "City",
        placeholder: "City",
      },
      zip_code: {
        type: "text",
        required: false,
        label: "ZIP / Postal Code",
        placeholder: "ZIP code",
      },
      state: {
        type: "text",
        required: false,
        label: "State / Province",
        placeholder: "State",
      },
    },
    sections: [
      {
        fields: ["user_avatar"],
        gridClass: "space-y-4",
      },
      {
        fields: ["first_name", "last_name", "profession"],
        gridClass: "grid grid-cols-3 gap-4",
      },
      {
        fields: ["address", "birth_date", "sex"],
        gridClass: "grid grid-cols-3 gap-4",
      },
      {
        fields: ["country", "city", "zip_code", "state"],
        gridClass: "grid grid-cols-4 gap-4",
      },
    ],
  };

  const handleProfileSubmit = async (formData) => {
    setProfileLoading(true);
    dispatch(setError(""));
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");
      dispatch(updateUserProfile(data.profile));
      // Set profile_verified: true if all required fields are now filled
      const verifyRes = await fetch("/api/users/verify-complete", {
        method: "PATCH",
      });
      const verifyData = await verifyRes.json();
      if (verifyRes.ok) dispatch(updateUserProfile(verifyData.user));
      dispatch(
        setError({ message: "Profile updated successfully!", type: "success" }),
      );
      setStage(2);
    } catch (err) {
      dispatch(setError({ message: err.message, type: "error" }));
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSendVerification = async () => {
    setEmailLoading(true);
    try {
      const res = await fetch("/api/resend/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Failed to send verification email");
      dispatch(
        setError({
          message: "Verification email sent! Check your inbox.",
          type: "success",
        }),
      );
      onClose();
    } catch (err) {
      dispatch(setError({ message: err.message, type: "error" }));
    } finally {
      setEmailLoading(false);
    }
  };

  const handleCheckEmailVerification = async () => {
    setCheckingVerification(true);
    try {
      const res = await fetch("/api/users/verify-complete", {
        method: "PATCH",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Check failed");
      dispatch(updateUserProfile(data.user));
      if (data.user.email_verified) {
        dispatch(setError({ message: "Email verified!", type: "success" }));
      } else {
        dispatch(
          setError({
            message: "Email not yet verified. Please check your inbox.",
            type: "error",
          }),
        );
      }
    } catch (err) {
      dispatch(setError({ message: err.message, type: "error" }));
    } finally {
      setCheckingVerification(false);
    }
  };

  return (
    <GlobalModal
      isOpen={isOpen}
      onClose={onClose}
      title="Verify Your Account"
      maxWidth="max-w-3xl"
    >
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between mb-1">
          <span className="text-xs text-gray-400">Verification Progress</span>
          <span className="text-xs font-bold text-green-400">{progress}%</span>
        </div>
        <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-green-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        {isFullyVerified && (
          <p className="text-xs text-green-400 mt-1">Account verified</p>
        )}
      </div>

      {/* Stage Tabs */}
      <div className="flex mb-6 border-b border-stone-700 *:cursor-pointer">
        <button
          onClick={() => setStage(1)}
          className={`flex-1 pb-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            stage === 1
              ? "border-gold text-gold"
              : "border-transparent text-cream/80 hover:text-cream"
          }`}
        >
          Profile Info
        </button>
        <button
          onClick={() => setStage(2)}
          className={`flex-1 pb-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            stage === 2
              ? "border-gold text-gold"
              : "border-transparent text-cream/80 hover:text-cream"
          }`}
        >
          Email Verification
        </button>
      </div>

      {/* Stage 1: Profile Form */}
      {stage === 1 && (
        <SubmissionForm
          formConfig={profileFormConfig}
          onSubmit={handleProfileSubmit}
          isLoading={profileLoading}
          submitButtonText="Save & Continue"
          showGoogle={false}
        />
      )}

      {/* Stage 2: Email Verification */}
      {stage === 2 && (
        <div className="space-y-4 w-2/4 min-h-96 mx-auto center flex-col">
          {/* Email status row */}
          <div className="flex items-center w-full justify-between p-4 bg-stone-900 border border-gold/20">
            <div>
              <span className="text-xs text-gold block mb-1">
                Email Address
              </span>
              <span className="text-sm text-cream">{user?.email}</span>
            </div>
            <div>
              {user?.email_verified ? (
                <div className="bg-green-500/20 flex items-center gap-1 px-3 py-1">
                  <FaCheckCircle className="text-green-500 text-sm" />
                  <span className="text-green-400 text-sm font-medium">
                    Verified
                  </span>
                </div>
              ) : (
                <div className="bg-red-500/10 flex items-center gap-1 px-3 py-1">
                  <FaExclamationTriangle className="text-red-400 text-sm" />
                  <span className="text-red-400 text-sm">Unverified</span>
                </div>
              )}
            </div>
          </div>

          {!user?.email_verified && (
            <Button
              text={emailLoading ? "Sending..." : "Send Verification Email"}
              icon={<FaEnvelope />}
              loading={emailLoading}
              disabled={emailLoading}
              onClick={handleSendVerification}
              className="w-full"
            />
          )}

          {isFullyVerified && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 flex items-center gap-3">
              <FaCheckCircle className="text-green-500 text-xl flex-shrink-0" />
              <div>
                <p className="text-green-400 font-semibold text-sm">
                  Account Fully Verified!
                </p>
                <p className="text-gray-400 text-xs mt-0.5">
                  Your profile and email address have been verified.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </GlobalModal>
  );
};

export default UserVerificationModal;
