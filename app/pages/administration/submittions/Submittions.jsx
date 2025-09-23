import SectionContainer from '@/app/components/containers/SectionContainer'
import FlexBox from '@/app/components/containers/FlexBox'
import SubmittionCard from './card/SubmittionCard'

const Submittions = ({ submissions, type = 'artist' }) => {
  const isClub = type === 'club'
  const isEvent = type === 'event'
  const title = isClub ? 'Club Submissions' : isEvent ? 'Event Submissions' : 'Artist Submissions'
  const description = isClub
    ? 'Review and approve pending club submissions'
    : isEvent
      ? 'Review and approve pending event submissions'
      : 'Review and approve pending artist submissions'

  if (submissions.length === 0) {
    return (
      <SectionContainer
        title={title}
        description={description}
      >
        <FlexBox type="center-col" className="py-20">
          <p className="text-gold/70 text-lg">No pending submissions</p>
        </FlexBox>
      </SectionContainer>
    )
  }

  return (
    <SectionContainer
      title={title}
      description={`${submissions.length} pending submission${submissions.length !== 1 ? 's' : ''} awaiting review`}
    >
      <div className='w-full'>
        <SubmittionCard submissions={submissions} type={type} />
      </div>
    </SectionContainer>
  )
}

export default Submittions