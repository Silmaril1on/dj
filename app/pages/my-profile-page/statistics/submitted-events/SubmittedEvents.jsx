import MotionCount from '@/app/components/ui/MotionCount';
import SectionContainer from '@/app/components/containers/SectionContainer';
import RecentActivityCard from '@/app/components/materials/RecentActivityCard';
import Paragraph from '@/app/components/ui/Paragraph';
import ErrorCode from '@/app/components/ui/ErrorCode';

const SubmittedEvents = ({ data, error }) => {
    const totalSubmittedEvents = data?.totalSubmittedEvents || 0;
    const recentEvents = data?.recentEvents || [];

    if (error) {
        return (
            <SectionContainer size="sm" title="My Submitted Events" description="My Submitted Events Statistics">
                <ErrorCode title="Error loading submitted events statistics" description={error} />
            </SectionContainer>
        );
    }

    if (totalSubmittedEvents === 0 || !recentEvents || recentEvents.length === 0) {
        return (
            <SectionContainer size="sm" title="My Submitted Events" description="My Submitted Events Statistics">
                <ErrorCode title="No submitted events yet" description="Submit events to see your statistics!" />
            </SectionContainer>
        );
    }

    return (
        <SectionContainer size="sm" title="Submitted Events" description="My Submitted Events Statistics" className="bg-stone-900">
            <div className="w-full flex flex-col justify-between h-full space-y-2">
                {/* HEADER */}
                <div className='w-full flex justify-start gap-3'>
                    <MotionCount data={totalSubmittedEvents} />
                    <Paragraph text="Your total submitted events and the latest ones you added." />
                </div>
                {/* CONTENT */}
                {recentEvents && recentEvents.length > 0 && (
                    <div className="flex-1 flex flex-col">
                        {recentEvents.map((event, index) => (
                            <RecentActivityCard
                                key={`${event.id}-${index}`}
                                item={event}
                                index={index}
                                href={`/events/${event.id}`}
                                imageField="event_image"
                                primaryNameField="event_name"
                                secondaryNameField="promoter"
                                dateField="created_at"
                                imageAlt={event.event_name}
                            />
                        ))}
                    </div>
                )}
                {/* FOOTER */}
                <div>
                    <p className="text-chino/60 text-sm text-center secondary">
                        Total Submitted Events: <span className="text-gold font-semibold">{totalSubmittedEvents}</span>
                    </p>
                </div>
            </div>
        </SectionContainer>
    );
};

export default SubmittedEvents;