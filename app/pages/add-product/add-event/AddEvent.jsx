'use client'
import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { setError } from '@/app/features/modalSlice'
import { showSuccess } from '@/app/features/successSlice'
import { formConfigs } from '@/app/helpers/formData/formConfigs'
import SubmissionForm from '@/app/components/forms/SubmissionForm'
import FormContainer from '@/app/components/forms/FormContainer'
import TermsAndConditions from '@/app/components/materials/TermsAndConditions'

const AddEvent = () => {
    const dispatch = useDispatch()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (formData) => {
        setIsSubmitting(true)
        dispatch(setError(''))

        try {
            const response = await fetch('/api/events', {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to create event')
            }

            const result = await response.json()
            dispatch(showSuccess({
                type: 'artist_date',
                message: 'Event created successfully!',
                data: result.data
            }))
        } catch (err) {
            dispatch(setError({ message: err.message, type: 'error' }))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className='flex flex-col lg:flex-row gap-6 items-start'>
            <div className='flex-1 w-full'>
                <FormContainer
                    maxWidth="w-full"
                    title="Add Event"
                    description="Create a new event and share it with the community"
                >
                    <SubmissionForm
                        formConfig={formConfigs.addEvent}
                        onSubmit={handleSubmit}
                        isLoading={isSubmitting}
                        submitButtonText="Create Event"
                    />
                </FormContainer>
            </div>
            <div className='w-full lg:w-[35%] lg:min-w-[400px]'>
                <TermsAndConditions type="event" />
            </div>
        </div>
    )
}

export default AddEvent