import Button from '@/app/components/buttons/Button';
import FlexBox from '@/app/components/containers/FlexBox';
import SectionContainer from '@/app/components/containers/SectionContainer';
import ArtistCountry from '@/app/components/materials/ArtistCountry';
import ProfilePicture from '@/app/components/materials/ProfilePicture';
import ErrorCode from '@/app/components/ui/ErrorCode';
import StatusIndicator from '@/app/components/ui/StatusIndicator';
import Title from '@/app/components/ui/Title';
import Link from 'next/link';
import { formatTime } from '@/app/helpers/utils';
import { MdVisibility } from 'react-icons/md';

const SubmittedArtist = ({ data, error }) => {

  if (error) {
    return (
      <SectionContainer size="sm" title="My Artist Profile" description="This is your artist profile">
        <ErrorCode
          title="Error loading submitted artists"
          description={error}
        />
      </SectionContainer>
    );
  }

  if (!data || data.length === 0) {
    return (
      <SectionContainer
        size="sm"
        title="My Artist Profile"
        className='bg-stone-900'
        description="Update your artist profile"
      >
        <ErrorCode
          title="Your artist profile is not yet submitted"
          description="Do you have artist profile? Please submit it to see your profile here."
          action={
            <Link className=' text-blue hover:text-blue-600 transition-colors duration-200' href="/add-product/add-artist">Submit Artist Profile</Link>
          }
        />
      </SectionContainer>
    );
  }

  return (
    <SectionContainer
      size="sm"
      title="My Artist Profile"
      description="Your artist profile"
      className="bg-stone-900"
    >
      <section className="w-full flex flex-col lg:flex-row space-y-2 lg:space-y-0">
        <div className="flex gap-2 lg:gap-5">
          <ProfilePicture type="avatar" avatar_url={data[0]?.artist_image} />
          <div className="flex items-start justify-center flex-col ">
            <Title
              size="xl"
              className="uppercase"
              text={data[0]?.stage_name || data[0]?.name}
            />
            <span className="text-cream secondary text-xs lg:text-sm">
              Submitted: {formatTime(data[0]?.created_at)}
            </span>
            <ArtistCountry artistCountry={data[0]} />
          </div>
        </div>
        <div className="flex flex-col flex-1 gap-2 justify-center xl:flex-row xl:items-center">
          <StatusIndicator status={data[0]?.status} />
          <Button
            icon={<MdVisibility />}
            type="success"
            text="View Profile"
            href={`/artists/${data[0]?.id}`}
          />
        </div>
      </section>
    </SectionContainer>
  );
};

export default SubmittedArtist;