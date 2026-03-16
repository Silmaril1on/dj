import Button from "@/app/components/buttons/Button";
import SectionContainer from "@/app/components/containers/SectionContainer";
import ArtistCountry from "@/app/components/materials/ArtistCountry";
import ProfilePicture from "@/app/components/materials/ProfilePicture";
import ErrorCode from "@/app/components/ui/ErrorCode";
import StatusIndicator from "@/app/components/ui/StatusIndicator";
import Title from "@/app/components/ui/Title";
import Link from "next/link";
import { formatTime } from "@/app/helpers/utils";
import { MdVisibility } from "react-icons/md";

/**
 * Generic profile submission card.
 * Used by: Submitted Artist, Submitted Club slots.
 *
 * @param {Array}    data             - API data array; uses data[0]
 * @param {string}   error            - Error message, if any
 * @param {string}   title            - Section title (e.g. "My Artist Profile")
 * @param {string}   description      - Section description
 * @param {string}   imageField       - Item key for the avatar image URL
 * @param {function} getDisplayName   - (item) => display name string
 * @param {function} getHref          - (item) => profile href string
 * @param {string}   submitHref       - Where to redirect to create the profile
 * @param {string}   submitLabel      - CTA link text
 * @param {string}   emptyTitle       - Empty-state heading
 * @param {string}   emptyDescription - Empty-state body text
 * @param {function} [renderExtra]    - Optional: (item) => JSX for extra info (e.g. capacity)
 */
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
          action={
            <Link
              className="text-blue hover:text-blue-600 transition-colors duration-200"
              href={submitHref}
            >
              {submitLabel}
            </Link>
          }
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
          <ProfilePicture type="avatar" avatar_url={item[imageField]} />
          <div className="flex items-start justify-center flex-col">
            <Title
              size="xl"
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
