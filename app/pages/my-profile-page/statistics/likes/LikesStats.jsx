import MotionCount from '@/app/components/ui/MotionCount';
import SectionContainer from '@/app/components/containers/SectionContainer';
import RecentActivityCard from '@/app/components/materials/RecentActivityCard';
import Paragraph from '@/app/components/ui/Paragraph';
import ErrorCode from '@/app/components/ui/ErrorCode';

const LikesStats = ({ data, error }) => {
  const { totalLikes, recentArtists } = data;

  if (error) {
    return (
      <SectionContainer size="sm" title="My Likes" description="My Like Statistics">
        <ErrorCode
          title="Error loading likes statistics"
          description={error}
        />
      </SectionContainer>
    );
  }

  if (totalLikes === 0 || !recentArtists || recentArtists.length === 0) {
    return (
      <SectionContainer
        size="sm"
        title="My Likes"
        description="My Like Statistics"
        className='bg-stone-900'
      >
        <ErrorCode
          title="No likes yet"
          description="Start liking artists to see your statistics!"
        />
      </SectionContainer>
    );
  }

  return (
    <SectionContainer size="sm" title="Likes" description="My Like Statistics" className="bg-stone-900">
      <div className="w-full flex flex-col justify-between h-full space-y-2">
        {/* HEADER */}
        <div className='w-full flex justify-start gap-3'>
          <MotionCount data={totalLikes} />
          <Paragraph text="Your total likes and the latest artists you've clicked with. Tap any name to jump into their profile." />
        </div>
        {/* CONTENT - Takes full height */}
        {recentArtists && recentArtists.length > 0 && (
          <div className="flex-1 flex flex-col">
            {recentArtists.map((artist, index) => (
              <RecentActivityCard
                key={`${artist.id}-${index}`}
                item={artist}
                index={index}
                href={`/artists/${artist.id}`}
                imageField="artist_image"
                primaryNameField="stage_name"
                secondaryNameField="name"
                dateField="liked_at"
                imageAlt={artist.stage_name || artist.name}
              />
            ))}
          </div>

        )}
        {/* FOOTER */}
        <div>
          <p className="text-chino/60 text-sm text-center secondary">
            Total Likes: <span className="text-gold font-semibold">{totalLikes}</span>
          </p>
        </div>
      </div>
    </SectionContainer>
  );
};

export default LikesStats;