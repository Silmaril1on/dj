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

const SubmittedClub = ({ data, error }) => {

    if (error) {
        return (
            <SectionContainer size="sm" title="My Club Profile" description="This is your club profile">
                <ErrorCode
                    title="Error loading submitted clubs"
                    description={error}
                />
            </SectionContainer>
        );
    }

    if (!data || data.length === 0) {
        return (
          <SectionContainer
            size="sm"
            title="My Club Profile"
            className="bg-stone-900"
            description="Update your club profile"
          >
            <ErrorCode
              title="Your club profile is not yet submitted"
              description="Do you have a club profile? Please submit it to see your profile here."
              action={
                <Link
                  className=" text-blue hover:text-blue-600 transition-colors duration-200"
                  href="/add-product/add-club"
                >
                  Submit Club Profile
                </Link>
              }
            />
          </SectionContainer>
        );
    }

    return (
      <SectionContainer
        size="sm"
        title="My Club Profile"
        description="Your club profile"
        className="bg-stone-900"
      >
        <section className="gap-4 w-full pb-4 px-4 flex flex-col lg:flex-row">
          <div className="flex gap-2">
            <ProfilePicture type="avatar" avatar_url={data[0]?.club_image} />
            <div className="flex items-start justify-center  flex-col">
              <Title size="xl" className="uppercase" text={data[0]?.name} />
              <span className="text-cream secondary text-[10px] lg:text-sm">
                Submitted: {formatTime(data[0]?.created_at)}
              </span>
              <ArtistCountry artistCountry={data[0]} />
              {data[0]?.capacity && (
                <span className="text-gold/80 text-sm font-medium mt-1">
                  Capacity:{" "}
                  <span className="text-cream">{data[0].capacity}</span>
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col flex-1 gap-2 justify-center xl:flex-row xl:items-center">
            <StatusIndicator status={data[0]?.status} />
            <Button
              icon={<MdVisibility />}
              type="success"
              text="View Profile"
              href={`/clubs/${data[0]?.id}`}
            />
          </div>
        </section>
      </SectionContainer>
    );
};

export default SubmittedClub;