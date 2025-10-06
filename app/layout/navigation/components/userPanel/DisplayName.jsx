"use client"
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from "react-icons/md"
import UserSettings from "./UserSettings"
import ProfilePicture from "@/app/components/materials/ProfilePicture"
import NotificationIcon from "../NotificationIcon"
import MessageIcon from "../MessageIcon"

const DisplayName = ({ user, isSettingsOpen, settingsRef, toggleSettings, handleLogout }) => {

    return <div className="relative center gap-2" ref={settingsRef}>
        <MessageIcon />
        <NotificationIcon />
        <button
            onClick={toggleSettings}
            className="flex items-center gap-2 cursor-pointer"
        >
            <span className="text-sm text-gray-300 flex items-end flex-col leading-none">
                <i className='text-xs'>Hi,</i> <strong className='text-gold'>{user?.userName}</strong>
            </span>
            <ProfilePicture avatar_url={user?.user_avatar} />
            {isSettingsOpen ? (
                <MdKeyboardArrowUp size={20} />
            ) : (
                <MdKeyboardArrowDown size={20} />
            )}
        </button>
        <UserSettings
            user={user}
            avatar_url={user?.user_avatar}
            isOpen={isSettingsOpen}
            onLogout={handleLogout}
            toggleSettings={toggleSettings}
        />
    </div>
}

export default DisplayName