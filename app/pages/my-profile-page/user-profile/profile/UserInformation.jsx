import { capitalizeFirst, formatTime } from '@/app/helpers/utils'
import { CountryFlags } from '@/app/components/materials/CountryFlags'
import { MdEdit, MdLocationOn, MdPerson } from 'react-icons/md'
import FlexBox from '@/app/components/containers/FlexBox'
import Icon from '@/app/components/ui/Icon'
import SpanText from '@/app/components/ui/SpanText'

const UserInformation = ({ profile }) => {

  const getSexDisplay = (sex) => {
    if (!sex) return 'Not specified'
    const sexMap = {
      'male': 'Male',
      'female': 'Female',
      'other': 'Other',
      'prefer_not_to_say': 'Prefer not to say'
    }
    return sexMap[sex] || sex
  }

  // Helper function to render info item
  const renderInfoItem = (label, value,) => (
    <FlexBox type="column-start">
      <SpanText text={label} />
      <SpanText text={value} font="secondary" size="xs" color="chino" />
    </FlexBox>
  )

  // Helper function to render location item
  const renderLocationItem = (label, value,) => (
    <FlexBox type="column-start">
      <SpanText text={label} />
      <SpanText text={value} font="secondary" size="xs" color="chino" />
    </FlexBox>
  )
  return (
    <div className="p-8 bg-stone-800 w-2/4">
      {/* Personal Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex space-x-3">
            <Icon icon={<MdPerson />} color="gold" />
            <FlexBox type="column-start">
              <SpanText text="Personal Information" color="default" className='font-bold' />
              <SpanText text="Basic details about you" font="secondary" size="xs" />
            </FlexBox>
          </div>
          <div className="space-y-4 *:capitalize">
            {renderInfoItem(
              "First Name",
              profile?.first_name || 'Not specified'
            )}
            {renderInfoItem(
              "Last Name",
              profile?.last_name || 'Not specified'
            )}
            {renderInfoItem(
              "Profession",
              profile?.profession || 'Not specified'
            )}
            {renderInfoItem(
              "Birth Date",
              formatTime(profile?.birth_date) || 'Not specified'
            )}
            {renderInfoItem(
              "Sex",
              getSexDisplay(profile?.sex)
            )}

          </div>
        </div>
        {/* Location Information */}
        <div className="space-y-6">
          <div className="flex space-x-3 ">
            <Icon icon={<MdLocationOn />} color="gold" />
            <FlexBox type="column-start">
              <SpanText text="Location Information" color="default" className='font-bold' />
              <SpanText text="Where you're located" font="secondary" size="xs" />
            </FlexBox>
          </div>
          <div className="space-y-4">
            {profile?.address && renderInfoItem(
              "Address",
              profile.address
            )}
            <div className="grid grid-cols-1 gap-4">
              {profile?.city && renderLocationItem("City", capitalizeFirst(profile.city))}
              {profile?.state && renderLocationItem("State", capitalizeFirst(profile.state))}
              {profile?.country && (
                <FlexBox type="row-start" className="items-center gap-3">
                  <FlexBox type="column-start" className="leading-none">
                    <SpanText text="Country" />
                    <div className="flex items-center space-x-2 mt-1">
                      <CountryFlags
                        countryName={profile.country}
                        className="w-6 h-4 rounded-sm shadow-sm"
                      />
                      <SpanText text={capitalizeFirst(profile.country)} font="secondary" size="xs" color="chino" />
                    </div></FlexBox>
                </FlexBox>
              )}
              {profile?.zip_code && renderLocationItem("ZIP Code", profile.zip_code)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserInformation