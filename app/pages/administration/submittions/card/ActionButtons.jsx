import Button from '@/app/components/buttons/Button'
import FlexBox from '@/app/components/containers/FlexBox'
import { openEvaluationModal } from '@/app/features/evaluationSlice'
import { setError } from '@/app/features/modalSlice'
import { MdCheck, MdClose, MdVisibility } from 'react-icons/md'
import { useDispatch } from 'react-redux'

const ActionButtons = ({ submission, loadingStates, submissionsList, setLoadingStates, setSubmissionsList, type = 'artist' }) => {
  const dispatch = useDispatch()
  const isClub = type === 'club'
  const isEvent = type === 'event'
  const entityType = isClub ? 'club' : isEvent ? 'event' : 'artist'
  const apiEndpoint = isClub
    ? '/api/admin/submitted-clubs'
    : isEvent
      ? '/api/admin/submitted-events'
      : '/api/admin/submitted-artists'

  const handleView = (submission) => {
    dispatch(openEvaluationModal({ ...submission, __type: entityType }))
  }

  console.log(submission, "/////////");
  

  const handleAction = async (entityId, action) => {
    const loadingKey = `${entityId}_${action}`
    setLoadingStates(prev => ({ ...prev, [loadingKey]: true }))
    try {
      const response = await fetch(apiEndpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [isClub ? 'clubId' : isEvent ? 'eventId' : 'artistId']: entityId,
          action
        })
      })
      if (response.ok) {
        if (action === 'approve') {
          const submission = submissionsList.find(s => s.id === entityId)
          if (submission?.submitter) {
            await sendNotification(submission.submitter, action)
          }
        }
        setSubmissionsList(prev =>
          prev.filter(submission => submission.id !== entityId)
        )
        dispatch(setError({ message: `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} ${action}d successfully`, type: 'success' }))
      } else {
        console.error('Failed to update submission')
      }
    } catch (error) {
      console.error('Error updating submission:', error)
    } finally {
      setLoadingStates(prev => ({ ...prev, [loadingKey]: false }))
    }
  }

  const sendNotification = async (submitter, action) => {
    try {
      const message = action === 'approve'
        ? `Dear ${submitter.userName}, congratulations! Your submitted ${entityType} has been reviewed and approved. Your ${entityType} is now live on our platform.`
        : `Dear ${submitter.userName}, we have reviewed your submitted ${entityType}. Unfortunately, it doesn't meet our current requirements. Please feel free to submit again with proper details.`
      await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: submitter.id,
          userName: submitter.userName,
          email: submitter.email,
          message: message
        })
      })
    } catch (error) {
      console.error('Error sending notification:', error)
    }
  }

  return (
    <FlexBox className="gap-2 *:w-full">
      <Button
        text="View"
        icon={<MdVisibility />}
        size="small"
        onClick={() => handleView(submission)}
      />
      <Button
        text="Approve"
        icon={<MdCheck />}
        size="small"
        type="success"
        onClick={() => handleAction(submission.id, 'approve')}
        loading={loadingStates[`${submission.id}_approve`]}
      />
      <Button
        text="Decline"
        icon={<MdClose />}
        size="small"
        type="remove"
        onClick={() => handleAction(submission.id, 'decline')}
        loading={loadingStates[`${submission.id}_decline`]}
      />
    </FlexBox>
  )
}

export default ActionButtons