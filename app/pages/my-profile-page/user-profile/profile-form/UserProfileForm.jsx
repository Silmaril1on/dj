"use client"
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setError } from '@/app/features/modalSlice'
import { updateUserProfile } from '@/app/features/userSlice'
import SubmissionForm from '@/app/components/forms/SubmissionForm'
import Title from '@/app/components/ui/Title'
import { formConfigs } from '@/app/helpers/formData/formConfigs'
import FormContainer from '@/app/components/forms/FormContainer'

const UserProfileFrom = ({ profile, error, onCancel }) => {
  const dispatch = useDispatch()
  const [isLoading, setIsLoading] = useState(false)
  const globalError = useSelector(state => state.modal.error)

  const formConfig = {
    ...formConfigs.userProfile,
    initialData: {
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      birth_date: profile?.birth_date || '',
      sex: profile?.sex || '',
      address: profile?.address || '',
      country: profile?.country || '',
      city: profile?.city || '',
      state: profile?.state || '',
      zip_code: profile?.zip_code || '',
      user_avatar: profile?.user_avatar || profile?.avatar_url || ''
    }
  }

  const handleSubmit = async (formData) => {
    setIsLoading(true)
    dispatch(setError(''))
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        body: formData
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile')
      }
      dispatch(updateUserProfile(data.profile))
      window.dispatchEvent(new CustomEvent('profile-updated', {
        detail: { profile: data.profile }
      }))
      dispatch(setError({ message: 'Profile updated successfully!', type: 'success' }))
      if (onCancel) onCancel()
    } catch (error) {
      dispatch(setError({ message: error.message, type: 'error' }))
    } finally {
      setIsLoading(false)
    }
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <Title text="Error Loading Profile" color="crimson" />
        <p className="text-gray-600 dark:text-gray-400 mt-2">{error}</p>
      </div>
    )
  }

  return (
    <FormContainer
      maxWidth="max-w-4xl"
      title="My Profile" description="Update your personal information and avatar">
      <SubmissionForm
        formConfig={formConfig}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        error={globalError}
        submitButtonText="Update Profile"
      />
    </FormContainer>
  )
}

export default UserProfileFrom