import Submittions from '@/app/pages/administration/submittions/Submittions'

const SubmittedClubs = ({ submissions }) => {
    return <Submittions submissions={submissions} type="club" />
}

export default SubmittedClubs