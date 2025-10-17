import { capitalizeFirst, formatTime } from '@/app/helpers/utils'
import { CountryFlags } from '@/app/components/materials/CountryFlags'
import { MdLocationOn, MdPerson } from 'react-icons/md'
import FlexBox from '@/app/components/containers/FlexBox'
import Icon from '@/app/components/ui/Icon'
import SpanText from '@/app/components/ui/SpanText'

const UserInformation = ({ profile }) => {

  const getSexDisplay = (sex) => {
    if (!sex) return 'Not Specified'
    const sexMap = {
      'male': 'Male',
      'female': 'Female',
      'other': 'Other',
      'prefer_not_to_say': 'Prefer not to say'
    }
    return sexMap[sex] || sex
  }

  // Helper function to check if birth date is valid (not default 1970 date)
  const getFormattedBirthDate = (birthDate) => {
    if (!birthDate) return 'Not Specified'
    
    const date = new Date(birthDate)
    const year1970 = new Date('1970-01-01')
    
    // Check if it's the default 1970 date or an invalid date
    if (isNaN(date.getTime()) || 
        date.getFullYear() === 1970 || 
        date.getTime() === year1970.getTime()) {
      return 'Not Specified'
    }
    
    return formatTime(birthDate)
  }

  // Helper function to safely get value or return "Not Specified"
  const getValueOrNotSpecified = (value) => {
    if (!value || value.trim() === '' || value === null || value === undefined) {
      return 'Not Specified'
    }
    return value
  }

  // Helper function to render info item
  const renderInfoItem = (label, value) => (
    <FlexBox type="column-start">
      <SpanText text={label} />
      <SpanText 
        text={getValueOrNotSpecified(value)} 
        font="secondary" 
        size="xs" 
        color="chino" 
      />
    </FlexBox>
  )

  // Helper function to render location item
  const renderLocationItem = (label, value) => (
    <FlexBox type="column-start">
      <SpanText text={label} />
      <SpanText 
        text={getValueOrNotSpecified(value)} 
        font="secondary" 
        size="xs" 
        color="chino" 
      />
    </FlexBox>
  )

  return (
    <div className="p-8 bg-stone-900 w-full lg:w-2/4">
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
              profile?.first_name
            )}
            {renderInfoItem(
              "Last Name",
              profile?.last_name
            )}
            {renderInfoItem(
              "Profession",
              profile?.profession
            )}
            <FlexBox type="column-start">
              <SpanText text="Birth Date" />
              <SpanText 
                text={getFormattedBirthDate(profile?.birth_date)} 
                font="secondary" 
                size="xs" 
                color="chino" 
              />
            </FlexBox>
            <FlexBox type="column-start">
              <SpanText text="Sex" />
              <SpanText 
                text={getSexDisplay(profile?.sex)} 
                font="secondary" 
                size="xs" 
                color="chino" 
              />
            </FlexBox>
          </div>
        </div>

        {/* Location Information */}
        <div className="space-y-6">
          <div className="flex space-x-3">
            <Icon icon={<MdLocationOn />} color="gold" />
            <FlexBox type="column-start">
              <SpanText text="Location Information" color="default" className='font-bold' />
              <SpanText text="Where you're located" font="secondary" size="xs" />
            </FlexBox>
          </div>
          <div className="space-y-4">
            {/* Always show these location fields */}
            {renderLocationItem(
              "Address",
              profile?.address
            )}
            
            <div className="grid grid-cols-1 gap-4">
              {renderLocationItem(
                "City", 
                profile?.city ? capitalizeFirst(profile.city) : null
              )}
              
              {renderLocationItem(
                "State", 
                profile?.state ? capitalizeFirst(profile.state) : null
              )}
              
              {/* Country field with flag */}
              <FlexBox type="column-start">
                <SpanText text="Country" />
                {profile?.country && profile.country.trim() !== '' ? (
                  <div className="flex items-center space-x-2 mt-1">
                    <CountryFlags
                      countryName={profile.country}
                      className="w-6 h-4 rounded-sm shadow-sm"
                    />
                    <SpanText 
                      text={capitalizeFirst(profile.country)} 
                      font="secondary" 
                      size="xs" 
                      color="chino" 
                    />
                  </div>
                ) : (
                  <SpanText 
                    text="Not Specified" 
                    font="secondary" 
                    size="xs" 
                    color="chino" 
                  />
                )}
              </FlexBox>
              
              {renderLocationItem(
                "ZIP Code", 
                profile?.zip_code
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserInformation