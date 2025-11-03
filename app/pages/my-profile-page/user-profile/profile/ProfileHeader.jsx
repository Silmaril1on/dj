import Button from '@/app/components/buttons/Button'
import ProfilePicture from '@/app/components/materials/ProfilePicture'
import Icon from '@/app/components/ui/Icon'
import SpanText from '@/app/components/ui/SpanText'
import { formatTime } from '@/app/helpers/utils'
import { MdAccessTime, MdEmail, MdPerson } from 'react-icons/md'

const ProfileHeader = ({ profile, onUpdateClick, isEditing }) => {
  if (!profile) {
    return null;
  }

  return (
    <div className="bg-gold/20 p-3 lg:p-8 border-b border-gold/30">
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="relative">
          {profile?.user_avatar ? (
            <ProfilePicture type="avatar" avatar_url={profile.user_avatar} />
          ) : (
            <Icon icon={<MdPerson />} size="lg" color="gold" />
          )}
        </div>
        <div className="flex-1 text-center md:text-left">
          <div  className="space-y-2 flex items-center lg:items-start flex-col *:font-bold">
            <SpanText
              color="gold"
              icon={<MdPerson />}
              text={`${profile?.userName}`}
            />
            <SpanText icon={<MdEmail />} text={profile?.email} color="gold" />
            <SpanText icon={<MdAccessTime />} text={`Member since ${formatTime(profile.created_at)}`} color="gold" />
          </div>
          <div className="mt-4 flex justify-center lg:justify-start">
            <Button
              size="small"
              text={isEditing ? "Cancel Edit" : "Update My Info"}
              onClick={onUpdateClick}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileHeader