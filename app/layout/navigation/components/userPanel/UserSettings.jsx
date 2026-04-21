"use client";
import { useState } from "react";
import {
  MdPerson,
  MdSecurity,
  MdEventAvailable,
  MdVerifiedUser,
} from "react-icons/md";
import { IoMusicalNotes } from "react-icons/io5";
import PopUpBox from "@/app/components/containers/PopUpBox";
import Button from "@/app/components/buttons/Button";
import SpanText from "@/app/components/ui/SpanText";
import FlexBox from "@/app/components/containers/FlexBox";
import MyLink from "@/app/components/ui/MyLink";
import ProfilePicture from "@/app/components/materials/ProfilePicture";
import { FaHouse } from "react-icons/fa6";
import { MdFestival } from "react-icons/md";
import UserVerificationModal from "@/app/components/modals/UserVerificationModal";

const UserSettings = ({
  onLogout,
  isOpen,
  toggleSettings,
  avatar_url,
  isVerified,
  user,
}) => {
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);

  return (
    <>
      <PopUpBox
        isOpen={isOpen}
        className="absolute bottom-full mb-2 lg:bottom-auto lg:top-full right-0 lg:mt-2 w-64 bg-stone-800 shadow-xl border border-gold/30 z-50 *:p-3"
      >
        <SettingsHeader avatar_url={avatar_url} isVerified={isVerified} />
        <SettingsOption
          toggleSettings={toggleSettings}
          user={user}
          onVerifyClick={() => setVerifyModalOpen(true)}
        />
        <div className="border-t border-gold/30">
          <Button size="small" text="Logout" onClick={onLogout} />
        </div>
      </PopUpBox>
      <UserVerificationModal
        isOpen={verifyModalOpen}
        onClose={() => setVerifyModalOpen(false)}
      />
    </>
  );
};

const SettingsHeader = ({ avatar_url, isVerified }) => {
  return (
    <FlexBox
      type="row-center"
      className="gap-2 items-center border-b border-gold/30 relative"
    >
      <ProfilePicture avatar_url={avatar_url} />
      <FlexBox type="column-start" className="flex-1 *:leading-none">
        <SpanText
          text="User Settings"
          font="primary"
          color="default"
          className="text-sm font-bold"
        />
        <SpanText text="Manage your account" size="xs" className="secondary" />
        {isVerified && (
          <h1 className="text-[12px] text-green-600 secondary">
            Verified Account
          </h1>
        )}
      </FlexBox>
    </FlexBox>
  );
};

const SettingsOption = ({ toggleSettings, user, onVerifyClick }) => {
  return (
    <div>
      <MyLink
        href="/my-profile/personal-information"
        text="My Profile"
        icon={<MdPerson />}
        onClick={toggleSettings}
      />
      {user.submitted_artist_slug && (
        <MyLink
          href={`/artists/${user.submitted_artist_slug}`}
          text="My Artist Profile"
          icon={<IoMusicalNotes />}
          onClick={toggleSettings}
        />
      )}
      {user.submitted_club_slug && (
        <MyLink
          href={`/clubs/${user.submitted_club_slug}`}
          text="My Club Profile"
          icon={<FaHouse size={15} />}
          onClick={toggleSettings}
          className="pl-[1px]"
        />
      )}
      {user.submitted_festival_slug && (
        <MyLink
          href={`/festivals/${user.submitted_festival_slug}`}
          text="My Festival Profile"
          icon={<MdFestival />}
          onClick={toggleSettings}
        />
      )}
      {user.submitted_event_id && (
        <MyLink
          href={`/my-profile/activities/my-events`}
          text="My Events"
          icon={<MdEventAvailable />}
          onClick={toggleSettings}
        />
      )}
      <MyLink
        href="/my-profile/security"
        text="Security"
        icon={<MdSecurity />}
        onClick={toggleSettings}
      />
      {!(user.profile_verified && user.email_verified) && (
        <MyLink
          href="#"
          text="Verify Account"
          icon={<MdVerifiedUser />}
          onClick={onVerifyClick}
        />
      )}
    </div>
  );
};

export default UserSettings;
