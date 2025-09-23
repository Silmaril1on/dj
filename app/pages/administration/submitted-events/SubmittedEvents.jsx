import Submittions from '@/app/pages/administration/submittions/Submittions'

const SubmittedEvents = ({ submissions }) => {
    return <Submittions submissions={submissions} type="event" />
}

export default SubmittedEvents