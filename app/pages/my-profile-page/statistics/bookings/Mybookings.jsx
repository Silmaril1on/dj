import React from 'react';
import SectionContainer from '@/app/components/containers/SectionContainer';
import Title from '@/app/components/ui/Title';
import Paragraph from '@/app/components/ui/Paragraph';
import SpanText from '@/app/components/ui/SpanText';

const Mybookings = ({ data, error }) => {
  console.log("📊 Mybookings data:", data);

  if (error) {
    return (
      <SectionContainer title="My Bookings" description="Error loading bookings" className="bg-stone-900">
        <div className="text-center py-8">
          <Title text="Error" className="text-red-400 mb-2" />
          <Paragraph text={error} className="text-stone-400" />
        </div>
      </SectionContainer>
    );
  }

  if (!data) {
    return (
      <SectionContainer title="My Bookings" description="Loading..." className="bg-stone-900">
        <div className="text-center py-8">
          <Title text="Loading..." className="text-stone-400" />
        </div>
      </SectionContainer>
    );
  }

  const { stats } = data;

  return (
    <SectionContainer
      size="sm"
      title="My Bookings"
      description={`${stats.total} total booking requests received`}
      className="bg-stone-900"
    >
      <section className='flex flex-col gap-3 w-full'>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-stone-800 p-2 text-center border border-stone-700">
            <Title
              text={stats.total.toString()}
              size="xl"
              className="text-cream mb-2"
            />
            <SpanText
              text="Total Bookings"
              size="sm"
              className="text-stone-400"
            />
          </div>
          <div className="bg-green-900/30 p-2 text-center border border-green-600/30 ">
            <Title
              text={stats.confirmed.toString()}
              size="xl"
              className="text-green-400 mb-2"
            />
            <SpanText text="Confirmed" size="sm" className="text-green-300" />
          </div>
          <div className="bg-yellow-900/30 p-2 text-center border border-gold/30 ">
            <Title
              text={stats.pending.toString()}
              size="xl"
              className="text-gold mb-2"
            />
            <SpanText text="Pending" size="sm" className="text-yellow-300" />
          </div>
          <div className="bg-red-900/30 p-2 text-center border border-red-600/30 ">
            <Title
              text={stats.declined.toString()}
              size="xl"
              className="text-red-400 mb-2"
            />
            <SpanText text="Declined" size="sm" className="text-red-300" />
          </div>
        </div>

        {stats.total > 0 && (
          <div className="p-3 bg-stone-800/50 rounded-sm">
            <Title text="Summary" size="sm" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <SpanText text="Success Rate:" color="chino" font="secondary" size="xs" />
                <SpanText
                  text={` ${Math.round(
                    (stats.confirmed / stats.total) * 100
                  )}%`}
                  className="text-green-400 font-bold"
                />
              </div>
              <div>
                <SpanText text="Pending Response:" color="chino" font="secondary" size="xs" />
                <SpanText
                  text={` ${stats.pending} requests`}
                  className="text-gold font-bold"
                />
              </div>
              <div>
                <SpanText text="Decline Rate:" color="chino" font="secondary" size="xs" />
                <SpanText
                  text={` ${Math.round((stats.declined / stats.total) * 100)}%`}
                  className="text-red-400 font-bold"
                />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Empty State */}
      {stats.total === 0 && (
        <div className="text-center py-12">
          <Title text="No Bookings Yet" className="text-stone-400 mb-2" />
          <Paragraph
            text="You haven't received any booking requests yet."
            className="text-stone-500"
          />
        </div>
      )}
    </SectionContainer>
  );
};

export default Mybookings;