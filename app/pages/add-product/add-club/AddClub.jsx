'use client'
import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { setError } from '@/app/features/modalSlice'
import { showSuccess } from '@/app/features/successSlice'
import { formConfigs } from '@/app/helpers/formData/formConfigs'
import SubmissionForm from '@/app/components/forms/SubmissionForm'
import FormContainer from '@/app/components/forms/FormContainer'
import TermsAndConditions from '@/app/components/materials/TermsAndConditions'

const AddClub = () => {
    const dispatch = useDispatch()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const formConfig = formConfigs.addClub

    const handleSubmit = async (formData) => {
        setIsSubmitting(true)
        dispatch(setError(''))
        try {
            const response = await fetch('/api/club/add-club', {
                method: 'POST',
                body: formData,
            })
            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to submit club')
            }
            const result = await response.json()
            dispatch(showSuccess({
                type: 'club',
                image: result.data?.club_image || '',
                name: result.data?.name || '',
                country: result.data?.country || '',
                city: result.data?.city || ''
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
                    title="Add Club"
                    description="Submit a new club to our platform"
                >
                    <SubmissionForm
                        formConfig={formConfig}
                        onSubmit={handleSubmit}
                        isLoading={isSubmitting}
                        submitButtonText="Submit Club"
                    />
                </FormContainer>
            </div>
            <div className='w-full lg:w-[35%] lg:min-w-[400px]'>
                <TermsAndConditions type="club" />
            </div>
        </div>
    )
}

export default AddClub