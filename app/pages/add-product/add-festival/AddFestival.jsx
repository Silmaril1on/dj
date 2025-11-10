'use client'
import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter } from 'next/navigation'
import { setError } from '@/app/features/modalSlice'
import { showSuccess } from '@/app/features/successSlice'
import { formConfigs } from '@/app/helpers/formData/formConfigs'
import SubmissionForm from '@/app/components/forms/SubmissionForm'
import FormContainer from '@/app/components/forms/FormContainer'
import TermsAndConditions from '@/app/components/materials/TermsAndConditions'
import { selectUser } from '@/app/features/userSlice'
import Spinner from '@/app/components/ui/Spinner'
import ErrorCode from '@/app/components/ui/ErrorCode'

const AddFestival = () => {
    const dispatch = useDispatch()
    const router = useRouter()
    const user = useSelector(selectUser)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isEditMode, setIsEditMode] = useState(false)
    const [festivalData, setFestivalData] = useState(null)
    const [loading, setLoading] = useState(false)

    // Create form config with initial data for edit mode
    const formConfig = {
        ...formConfigs.addFestival,
        initialData: isEditMode && festivalData ? {
            name: festivalData.name || '',
            description: festivalData.description || '',
            bio: festivalData.bio || '',
            poster: festivalData.poster || '',
            start_date: festivalData.start_date || '',
            end_date: festivalData.end_date || '',
            location: festivalData.location || '',
            capacity_total: festivalData.capacity_total || '',
            capacity_per_day: festivalData.capacity_per_day || '',
            country: festivalData.country || '',
            city: festivalData.city || '',
            social_links: festivalData.social_links || [''],
        } : formConfigs.addFestival.initialData
    }

    // Check if we're in edit mode
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search)
        const edit = urlParams.get('edit')
        const festivalId = urlParams.get('festivalId')

        if (edit === 'true' && festivalId) {
            setIsEditMode(true)
            fetchFestivalData(festivalId)
        }
    }, [])

    const fetchFestivalData = async (festivalId) => {
        setLoading(true)
        try {
            const response = await fetch(`/api/festivals/${festivalId}`)
            if (response.ok) {
                const data = await response.json()
                setFestivalData(data.festival)
            } else {
                dispatch(setError({ message: 'Failed to fetch festival data', type: 'error' }))
            }
        } catch (error) {
            dispatch(setError({ message: 'Error fetching festival data', type: 'error' }))
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (formData) => {
        setIsSubmitting(true)
        dispatch(setError(''))
        try {
            const url = isEditMode ? `/api/festivals/add-festival` : '/api/festivals/add-festival'
            const method = isEditMode ? 'PATCH' : 'POST'

            // Add festivalId for edit mode
            if (isEditMode && festivalData) {
                formData.append('festivalId', festivalData.id)
            }

            const response = await fetch(url, {
                method,
                body: formData,
            })
            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || `Failed to ${isEditMode ? 'update' : 'submit'} festival`)
            }
            const result = await response.json()
            dispatch(showSuccess({
                type: 'festival',
                image: result.data?.poster || '',
                name: result.data?.name || '',
                country: result.data?.country || '',
                city: result.data?.city || '',
                location: result.data?.location || '',
                description: result.data?.description || ''
            }))
        } catch (err) {
            dispatch(setError({ message: err.message, type: 'error' }))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="flex flex-col lg:flex-row gap-6 items-start">
            {user?.submitted_festival_id && !isEditMode ? (
                <div className="flex-1 w-full h-98 center">
                    <ErrorCode
                        title="You have already submitted a festival"
                        description="You can only submit one festival profile. To edit your submission, use the edit link or contact support."
                    />
                </div>
            ) : (
                <div className="flex-1 w-full">
                    <FormContainer
                        maxWidth="w-full"
                        title={isEditMode ? "Edit Festival" : "Add Festival"}
                        description={
                            isEditMode
                                ? "Update your festival information"
                                : "Submit a new festival to our platform"
                        }
                    >
                        {loading ? (
                            <Spinner />
                        ) : (
                            <SubmissionForm
                                showGoogle={false}
                                formConfig={formConfig}
                                onSubmit={handleSubmit}
                                isLoading={isSubmitting}
                                submitButtonText={isEditMode ? "Update Festival" : "Submit Festival"}
                            />
                        )}
                    </FormContainer>
                </div>
            )}
            <div className="w-full lg:w-[35%] lg:min-w-[400px]">
                <TermsAndConditions type="festival" />
            </div>
        </div>
    )
}

export default AddFestival