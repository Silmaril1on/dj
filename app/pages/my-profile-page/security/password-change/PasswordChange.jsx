"use client";
import Button from "@/app/components/buttons/Button";
import { useState } from "react";
import {  MdVisibility, MdVisibilityOff } from "react-icons/md";
import PasswordStrengthIndicator from "@/app/components/forms/PasswordStrengthIndicator";
import { checkPasswordStrength } from "@/app/helpers/validatePwd";
import SectionContainer from "@/app/components/containers/SectionContainer";
import { useDispatch } from "react-redux";
import { setError } from "@/app/features/modalSlice";

const PasswordChange = () => {
  const dispatch = useDispatch()
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const handleShowPassword = (field) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleNewPasswordChange = (value) => {
    setNewPassword(value);
    setPasswordStrength(checkPasswordStrength(value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      dispatch(setError({ type: 'error', message: "New password and confirmation do not match." }));
      return;
    }
    setLoading(true);
    const res = await fetch("/api/users/security/password-change", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      dispatch(setError({ type: 'success', message: "Password changed successfully." }));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordStrength({});
    } else {
     dispatch(setError({ type: 'error', message: data.error || "An error occurred." }));
    }
  };

  return (
    <SectionContainer
      className="bg-stone-900"
      title="Change Password"
      description="Update your password settings.efew fef324t3fg3 "
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
        <form onSubmit={handleSubmit} className="space-y-4 ">
          {/* Current Password */}
          <div className="relative">
            <input
              type={showPassword.current ? "text" : "password"}
              placeholder="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="pr-10"
            />
            <span
              className="absolute right-3 top-3 cursor-pointer"
              onClick={() => handleShowPassword("current")}
            >
              {showPassword.current ? <MdVisibilityOff /> : <MdVisibility />}
            </span>
          </div>

          {/* New Password */}
          <div className="relative">
            <input
              type={showPassword.new ? "text" : "password"}
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => handleNewPasswordChange(e.target.value)}
              required
              className="pr-10"
            />
            <span
              className="absolute right-3 top-3 cursor-pointer"
              onClick={() => handleShowPassword("new")}
            >
              {showPassword.new ? <MdVisibilityOff /> : <MdVisibility />}
            </span>
          </div>
          {/* Password Strength Indicator */}
          {newPassword && (
            <PasswordStrengthIndicator
              strength={passwordStrength}
              password={newPassword}
            />
          )}

          {/* Confirm Password */}
          <div className="relative">
            <input
              type={showPassword.confirm ? "text" : "password"}
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="pr-10"
            />
            <span
              className="absolute right-3 top-3 cursor-pointer"
              onClick={() => handleShowPassword("confirm")}
            >
              {showPassword.confirm ? <MdVisibilityOff /> : <MdVisibility />}
            </span>
          </div>
          <Button
            text={loading ? "Changing..." : "Change Password"}
            type="submit"
            disabled={loading}
          />
        </form>
        <div>{/* You can add additional info or illustration here */}</div>
      </div>
    </SectionContainer>
  );
};

export default PasswordChange;