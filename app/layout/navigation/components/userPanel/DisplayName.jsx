"use client";
import { useState, useRef, useEffect } from "react";
import { useDispatch } from "react-redux";
import { clearUser } from "@/app/features/userSlice";
import { clearAllRatings } from "@/app/features/ratingSlice";
import { removeUserCookie } from "@/app/helpers/cookieUtils";
import { supabaseClient } from "@/app/lib/config/supabaseClient";
import { useRouter } from "next/navigation";
import { FaChevronDown } from "react-icons/fa";
import ProfilePicture from "@/app/components/materials/ProfilePicture";
import MessageIcon from "../MessageIcon";
import NotificationIcon from "../NotificationIcon";
import UserSettings from "./UserSettings";

const DisplayName = ({ user, type }) => {
  const dispatch = useDispatch();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await supabaseClient.auth.signOut();
      dispatch(clearUser());
      dispatch(clearAllRatings());
      setIsSettingsOpen(false);
      removeUserCookie();
      router.push("/");
    } catch (error) {
      router.push("/");
    }
  };

  const toggleSettings = () => {
    setIsSettingsOpen(!isSettingsOpen);
  };

  return (
    <div className="relative" ref={settingsRef}>
      <div className="flex items-center gap-2">
        <MessageIcon />
        {type === "mobile" && <div className="h-4 w-[1.5px] bg-gold/40" />}
        <NotificationIcon />
        {type === "mobile" && <div className="h-4 w-[1.5px] bg-gold/40" />}
        <button
          onClick={toggleSettings}
          className="flex items-center gap-2 text-cream hover:text-gold duration-300 cursor-pointer"
        >
          <span className="text-sm text-gray-300 hidden lg:flex items-end flex-col leading-none">
            <i className="text-xs">Hi,</i>{" "}
            <strong className="text-gold">{user?.userName}</strong>
          </span>
          <ProfilePicture
            avatar_url={user?.user_avatar}
            size="sm"
            type={type}
          />
          <FaChevronDown
            className={`text-xs transition-transform duration-300 ${
              isSettingsOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>
      <UserSettings
        user={user}
        avatar_url={user?.user_avatar}
        isOpen={isSettingsOpen}
        onLogout={handleLogout}
        toggleSettings={toggleSettings}
      />
    </div>
  );
};

export default DisplayName;
