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

const AddClub = () => {
    const dispatch = useDispatch()
    const router = useRouter()
    const user = useSelector(selectUser)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isEditMode, setIsEditMode] = useState(false)
    const [clubData, setClubData] = useState(null)
    const [loading, setLoading] = useState(false)

    // Create form config with initial data for edit mode
    const formConfig = {
        ...formConfigs.addClub,
        initialData: isEditMode && clubData ? {
            name: clubData.name || '',
            country: clubData.country || '',
            city: clubData.city || '',
            address: clubData.address || '',
            description: clubData.description || '',
            club_image: clubData.club_image || '',
            social_links: clubData.social_links || [''],
            residents: clubData.residents || [''],
            capacity: clubData.capacity || '',
        } : formConfigs.addClub.initialData
    }

    // Check if we're in edit mode
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search)
        const edit = urlParams.get('edit')
        const clubId = urlParams.get('clubId')

        if (edit === 'true' && clubId) {
            setIsEditMode(true)
            fetchClubData(clubId)
        }
    }, [])

    const fetchClubData = async (clubId) => {
        setLoading(true)
        try {
            const response = await fetch(`/api/club/${clubId}`)
            if (response.ok) {
                const data = await response.json()
                setClubData(data.club)
            } else {
                dispatch(setError({ message: 'Failed to fetch club data', type: 'error' }))
            }
        } catch (error) {
            dispatch(setError({ message: 'Error fetching club data', type: 'error' }))
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (formData) => {
        setIsSubmitting(true)
        dispatch(setError(''))
        try {
            const url = isEditMode ? `/api/club/add-club` : '/api/club/add-club'
            const method = isEditMode ? 'PATCH' : 'POST'

            // Add clubId for edit mode
            if (isEditMode && clubData) {
                formData.append('clubId', clubData.id)
            }

            const response = await fetch(url, {
                method,
                body: formData,
            })
            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || `Failed to ${isEditMode ? 'update' : 'submit'} club`)
            }
            const result = await response.json()
            dispatch(showSuccess({
                type: 'club',
                image: result.data?.club_image || '',
                name: result.data?.name || '',
                country: result.data?.country || '',
                city: result.data?.city || '',
                address: result.data?.address || '',
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
            {user?.submitted_club_id && !isEditMode ? (
                <div className="flex-1 w-full h-98 center">
                    <ErrorCode
                        title="You have already submitted a club"
                        description="You can only submit one club profile. To edit your submission, use the edit link or contact support."
                    />
                </div>
            ) : (
                <div className="flex-1 w-full">
                    <FormContainer
                        maxWidth="w-full"
                        title={isEditMode ? "Edit Club" : "Add Club"}
                        description={
                            isEditMode
                                ? "Update your club information"
                                : "Submit a new club to our platform"
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
                                submitButtonText={isEditMode ? "Update Club" : "Submit Club"}
                            />
                        )}
                    </FormContainer>
                </div>
            )}
            <div className="w-full lg:w-[35%] lg:min-w-[400px]">
                <TermsAndConditions type="club" />
            </div>
        </div>
    )
}

export default AddClub

