"use client";
import { motion } from "framer-motion";
import SectionContainer from '@/app/components/containers/SectionContainer';
import MotionCount from '@/app/components/ui/MotionCount';
import Paragraph from '@/app/components/ui/Paragraph';
import ErrorCode from '@/app/components/ui/ErrorCode';

const RatingsStats = ({ data, error, title = "Ratings", description = "My Rating Statistics",  }) => {

  if (error) {
    return (
      <SectionContainer className="bg-stone-900" size="sm" title={title} description={description}>
        <ErrorCode
          title="Error loading rating statistics"
          description={error}
        />
      </SectionContainer>
    );
  }

  if (!data) {
    return (
      <div className="p-4 bg-chino dark:bg-black border border-gold/50 rounded-lg">
        <p className="text-gold text-center">Loading rating statistics...</p>
      </div>
    );
  }

  const { ratingData, totalRatings } = data;

  if (totalRatings === 0) {
    return (
      <SectionContainer
        size="sm"
        title={title}
        className="bg-stone-900"
        description={description}
      >
        <ErrorCode
          title="No ratings yet"
          description="Start rating artists to see your insights!"
        />
      </SectionContainer>
    );
  }

  return (
    <SectionContainer size="sm" title={title} description={description} className="bg-stone-900 flex flex-col h-full">
      <div className="w-full flex flex-col justify-between h-full space-y-4">
        {/* HEADER */}
        <div className='w-full flex justify-start gap-3'>
          <MotionCount data={totalRatings} />
          <Paragraph text={description} />
        </div>

        {/* CONTENT - Takes full height */}
        <div className="flex-1 flex flex-col justify-between grow-1">
          <div className="space-y-2 flex flex-1 grow-1 flex-col">
            {ratingData.map(({ rating, count, percentage }) => (
              <div key={rating} className="flex items-center gap-3 ">
                <span className="text-cream font-bold w-6 text-right">{rating}</span>
                <motion.div
                  initial={{ width: 0 }}
                  viewport={{ once: true }}
                  whileInView={{ width: `${percentage}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="h-6 rounded-sm bg-gold"
                />
                <span className="text-cream text-[10px] secondary font-medium min-w-[60px]">
                  {percentage.toFixed(1)}% ({count})
                </span>
              </div>
            ))}
          </div>


        </div>
        {/* FOOTER */}
        <div>
          <p className="text-chino/60 text-sm text-center secondary">
            Total Ratings: <span className="text-gold font-semibold">{totalRatings}</span>
          </p>
        </div>
      </div>
    </SectionContainer>
  );
};

export default RatingsStats;