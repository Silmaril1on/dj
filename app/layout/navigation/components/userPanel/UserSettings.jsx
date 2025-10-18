import { MdPerson, MdSecurity, MdEventAvailable } from "react-icons/md";
import { IoMusicalNotes } from "react-icons/io5";
import PopUpBox from '@/app/components/containers/PopUpBox'
import Button from '@/app/components/buttons/Button'
import SpanText from '@/app/components/ui/SpanText'
import FlexBox from '@/app/components/containers/FlexBox'
import MyLink from '@/app/components/ui/MyLink'
import ProfilePicture from '@/app/components/materials/ProfilePicture'
import { FaHouse } from "react-icons/fa6";

const UserSettings = ({ onLogout, isOpen, toggleSettings, avatar_url, user }) => {

  return (
    <PopUpBox isOpen={isOpen} className="absolute -top-[215px] lg:top-full right-0 mt-4 w-64 bg-stone-800 shadow-xl border border-gold/30 z-50 *:p-3">
      <SettingsHeader avatar_url={avatar_url} />
      <SettingsOption toggleSettings={toggleSettings} user={user} />
      <div className="border-t border-gold/30">
        <Button
          size="small"
          text="Logout"
          onClick={onLogout}
        />
      </div>
    </PopUpBox>
  )
}

const SettingsHeader = ({ avatar_url }) => {
  return (
    <FlexBox type="row-center" className="gap-2 items-center border-b border-gold/30">
      <ProfilePicture avatar_url={avatar_url} />
      <FlexBox type="column-start" className="flex-1 leading-none" >
        <SpanText text="User Settings" font="primary" color="default" className="text-sm" />
        <SpanText text="Manage your account" size="xs" />
      </FlexBox>
    </FlexBox>
  )
}

const SettingsOption = ({ toggleSettings, user }) => {
  return (
    <div className="space-y-1">
      <MyLink
        href="/my-profile/personal-information"
        text="My Profile"
        icon={<MdPerson />}
        onClick={toggleSettings}
      />
      {user.submitted_artist_id && (
        <MyLink
          href={`/artists/${user.submitted_artist_id}`}
          text="My Artist Profile"
          icon={<IoMusicalNotes />}
          onClick={toggleSettings}
        />
      )}
      {user.submitted_club_id && (
        <MyLink
          href={`/clubs/${user.submitted_club_id}`}
          text="My Club Profile"
          icon={<FaHouse />}
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
    </div>
  );
}

export default UserSettings