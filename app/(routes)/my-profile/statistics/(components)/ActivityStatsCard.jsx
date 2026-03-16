import MotionCount from "@/app/components/ui/MotionCount";
import SectionContainer from "@/app/components/containers/SectionContainer";
import RecentActivityCard from "@/app/components/materials/RecentActivityCard";
import Paragraph from "@/app/components/ui/Paragraph";
import ErrorCode from "@/app/components/ui/ErrorCode";

const ActivityStatsCard = ({
  data,
  error,
  title = "",
  description = "",
  totalKey,
  totalLabel,
  itemsKey,
  paragraphText = "",
  emptyTitle,
  emptyDescription,
  getHref = () => "#",
  imageField,
  primaryNameField,
  secondaryNameField,
  dateField,
  getImageAlt = () => "",
}) => {
  const total = data?.[totalKey] ?? 0;
  const items = data?.[itemsKey] ?? [];

  if (error) {
    return (
      <SectionContainer size="sm" title={title} description={description}>
        <ErrorCode
          title={`Error loading ${title.toLowerCase()} statistics`}
          description={error}
        />
      </SectionContainer>
    );
  }

  if (total === 0 || !items.length) {
    if (!emptyTitle) return null;
    return (
      <SectionContainer
        size="sm"
        title={title}
        description={description}
        className="bg-stone-900"
      >
        <ErrorCode title={emptyTitle} description={emptyDescription} />
      </SectionContainer>
    );
  }

  return (
    <SectionContainer
      size="sm"
      title={title}
      description={description}
      className="bg-stone-900"
    >
      <div className="w-full flex flex-col justify-between h-full space-y-2">
        {/* HEADER */}
        <div className="w-full flex justify-start gap-3">
          <MotionCount data={total} />
          <Paragraph text={paragraphText} />
        </div>

        {/* CONTENT */}
        <div className="flex-1 flex flex-col">
          {items.map((item, index) => (
            <RecentActivityCard
              key={`${item.id}-${index}`}
              item={item}
              index={index}
              href={getHref(item)}
              imageField={imageField}
              primaryNameField={primaryNameField}
              secondaryNameField={secondaryNameField}
              dateField={dateField}
              imageAlt={getImageAlt(item)}
            />
          ))}
        </div>

        {/* FOOTER */}
        <p className="text-chino/60 text-sm text-center secondary">
          {totalLabel}: <span className="text-gold font-semibold">{total}</span>
        </p>
      </div>
    </SectionContainer>
  );
};

export default ActivityStatsCard;
