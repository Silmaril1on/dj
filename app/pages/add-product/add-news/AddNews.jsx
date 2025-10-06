'use client'
import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { setError } from '@/app/features/modalSlice'
import { showSuccess } from '@/app/features/successSlice'
import { formConfigs } from '@/app/helpers/formData/formConfigs'
import SubmissionForm from '@/app/components/forms/SubmissionForm'
import FormContainer from '@/app/components/forms/FormContainer'
import TermsAndConditions from '@/app/components/materials/TermsAndConditions'

const AddNews = () => {
  const dispatch = useDispatch()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (formData) => {
    setIsSubmitting(true)
    dispatch(setError(''))
    try {
      const response = await fetch('/api/admin/news', {
        method: 'POST',
        body: formData,
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit news')
      }
      const result = await response.json()
      dispatch(showSuccess({
        type: 'news',
        image: result.data?.news_image || '',
        title: result.data?.title || '',
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
      <div className="flex-1 w-full">
        <FormContainer
          maxWidth="w-full"
          title="Add News"
          description="Submit a news article to the platform"
        >
          <SubmissionForm
            showGoogle={false}
            formConfig={formConfigs.addNews}
            onSubmit={handleSubmit}
            isLoading={isSubmitting}
            submitButtonText="Submit News"
          />
        </FormContainer>
      </div>
      <div className="w-full lg:w-[35%] lg:min-w-[400px]">
        <TermsAndConditions type="event" />
      </div>
    </div>
  );
}

export default AddNews