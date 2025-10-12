import MotionCount from '@/app/components/ui/MotionCount';
import SectionContainer from '@/app/components/containers/SectionContainer';
import RecentActivityCard from '@/app/components/materials/RecentActivityCard';
import Paragraph from '@/app/components/ui/Paragraph';
import ErrorCode from '@/app/components/ui/ErrorCode';

const ReviewsStats = ({ data, error }) => {
  const { totalReviews, recentArtists } = data;

  if (error) {
    return (
      <ErrorCode
        title="Error loading reviews statistics"
        description={error}
      />
    );
  }

  if (totalReviews === 0 || !recentArtists || recentArtists.length === 0) {
    return (
      <SectionContainer
        size="sm"
        title="My Reviews"
        className="bg-stone-900"
        description="My Review Statistics"
      >
        <ErrorCode
          title="No reviews yet"
          description="Start reviewing artists to see your review statistics!"
        />
      </SectionContainer>
    );
  }

  return (
    <SectionContainer
      size="sm"
      title="Reviews"
      description="My Review Statistics"
      className="bg-stone-900"
    >
      <div className="h-full flex flex-col">
        {/* HEADER */}
        <div className="flex justify-center items-center gap-3">
          <MotionCount data={totalReviews} />
          <Paragraph text="See how many reviews you've dropped and revisit your most recent ones." />
        </div>

        {/* CONTENT - grows to fill remaining space */}
        {recentArtists && recentArtists.length > 0 && (
          <div className="flex flex-col flex-1">
            {recentArtists.map((artist, index) => (
              <RecentActivityCard
                key={`${artist.id}-${index}`}
                item={artist}
                index={index}
                href={`/artists/${artist.id}`}
                imageField="artist_image"
                primaryNameField="stage_name"
                secondaryNameField="name"
                dateField="reviewed_at"
                imageAlt={artist.stage_name || artist.name}
              />
            ))}
          </div>
        )}

        {/* FOOTER */}
        <div>
          <p className="text-chino/60 text-sm text-center secondary">
            Total Reviews: <span className="text-gold font-semibold">{totalReviews}</span>
          </p>
        </div>
      </div>
    </SectionContainer>

  );
};

export default ReviewsStats;