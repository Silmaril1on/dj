import ProfileHeader from "./ProfileHeader"
import Statistics from "./Statistics"
import UserInformation from "./UserInformation"

const UserProfile = ({ profile, onUpdateClick, isEditing }) => {


  return (
    <div className="bg-stone-900 shadow-gold/15 border border-gold/30 overflow-hidden">
      <ProfileHeader profile={profile} onUpdateClick={onUpdateClick} isEditing={isEditing} />
      <div className="flex">
        <UserInformation profile={profile} />
        <Statistics />
      </div>
    </div>
  )
}

export default UserProfile