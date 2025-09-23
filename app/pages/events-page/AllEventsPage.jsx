import SectionContainer from '@/app/components/containers/SectionContainer'
import ErrorCode from '@/app/components/ui/ErrorCode'
import EventCard from './EventCard'

const AllEventsPage = ({ events = [], error }) => {
    if (error) {
        return (
            <SectionContainer size="lg" title="Events" description="Latest events">
                <ErrorCode title="Error loading events" description={error} />
            </SectionContainer>
        )
    }

    if (!events || events.length === 0) {
        return (
            <SectionContainer size="lg" title="Events" description="Latest events">
                <ErrorCode title="No events available" description="Check back later for new events." />
            </SectionContainer>
        )
    }

    return (
        <div className='grid grid-cols-5 gap-4 p-4'>
            <EventCard data={events} />
        </div>
    )
}

export default AllEventsPage