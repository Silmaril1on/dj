import Button from "@/app/components/buttons/Button";
import SectionContainer from "@/app/components/containers/SectionContainer";
import ArtistCountry from "@/app/components/materials/ArtistCountry";
import ProfilePicture from "@/app/components/materials/ProfilePicture";
import ErrorCode from "@/app/components/ui/ErrorCode";
import StatusIndicator from "@/app/components/ui/StatusIndicator";
import Title from "@/app/components/ui/Title";
import SubmitLink from "@/app/(routes)/my-profile/statistics/(components)/SubmitLink";
import { formatTime, resolveImage } from "@/app/helpers/utils";
import { MdVisibility } from "react-icons/md";

const SubmittedProfileCard = ({
  data,
  error,
  title,
  description,
  imageField,
  getDisplayName,
  getHref,
  submitHref,
  submitLabel,
  emptyTitle,
  emptyDescription,
  renderExtra,
}) => {
  if (error) {
    return (
      <SectionContainer size="sm" title={title} description={description}>
        <ErrorCode
          title={`Error loading ${title.toLowerCase()}`}
          description={error}
        />
      </SectionContainer>
    );
  }

  if (!data || data.length === 0) {
    return (
      <SectionContainer
        size="sm"
        title={title}
        className="bg-stone-900"
        description={`Update your ${title.toLowerCase()}`}
      >
        <ErrorCode
          title={emptyTitle}
          description={emptyDescription}
          action={<SubmitLink href={submitHref} label={submitLabel} />}
        />
      </SectionContainer>
    );
  }

  const item = data[0];

  return (
    <SectionContainer
      size="sm"
      title={title}
      description={description}
      className="bg-stone-900"
    >
      <section className="gap-4 w-full pb-4 flex flex-col lg:flex-row">
        <div className="flex gap-2">
          <ProfilePicture
            type="avatar"
            avatar_url={resolveImage(item[imageField], "md")}
          />
          <div className="flex items-start justify-center flex-col">
            <Title
              size="lg"
              className="uppercase"
              text={getDisplayName(item)}
            />
            <span className="text-cream secondary text-[10px] lg:text-sm">
              Submitted: {formatTime(item.created_at)}
            </span>
            <ArtistCountry artistCountry={item} />
            {renderExtra?.(item)}
          </div>
        </div>
        <div className="flex flex-col flex-1 gap-2 justify-center xl:flex-row xl:items-center">
          <StatusIndicator status={item.status} />
          <Button
            icon={<MdVisibility />}
            type="success"
            text="View Profile"
            href={getHref(item)}
          />
        </div>
      </section>
    </SectionContainer>
  );
};

export default SubmittedProfileCard;
