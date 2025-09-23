'use client'
import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useSearchParams } from 'next/navigation'
import { setError } from '@/app/features/modalSlice'
import { showSuccess } from '@/app/features/successSlice'
import { formConfigs } from '@/app/helpers/formData/formConfigs'
import SubmissionForm from '@/app/components/forms/SubmissionForm'
import FormContainer from '@/app/components/forms/FormContainer'
import TermsAndConditions from '@/app/components/materials/TermsAndConditions'

const AddArtist = () => {
  const dispatch = useDispatch()
  const searchParams = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [artistData, setArtistData] = useState(null)
  const [loading, setLoading] = useState(false)

  // Create form config with initial data for edit mode
  const formConfig = {
    ...formConfigs.addArtist,
    initialData: isEditMode && artistData ? {
      name: artistData.name || '',
      stage_name: artistData.stage_name || '',
      country: artistData.country || '',
      city: artistData.city || '',
      sex: artistData.sex || '',
      birth: artistData.birth || '',
      desc: artistData.desc || artistData.description || '',
      bio: artistData.bio || '',
      genres: artistData.genres || [''],
      social_links: artistData.social_links || [''],
      label: artistData.label || [''],
      artist_image: artistData.artist_image || ''
    } : formConfigs.addArtist.initialData
  }

  // Check if we're in edit mode
  useEffect(() => {
    const edit = searchParams.get('edit')
    const artistId = searchParams.get('artistId')

    if (edit === 'true' && artistId) {
      setIsEditMode(true)
      fetchArtistData(artistId)
    }
  }, [searchParams])

  const fetchArtistData = async (artistId) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/artists/${artistId}`)
      if (response.ok) {
        const data = await response.json()
        setArtistData(data)
      } else {
        dispatch(setError({ message: 'Failed to fetch artist data', type: 'error' }))
      }
    } catch (error) {
      dispatch(setError({ message: 'Error fetching artist data', type: 'error' }))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (formData) => {
    setIsSubmitting(true)
    dispatch(setError(''))
    try {
      const url = isEditMode ? `/api/artists/update-artist` : '/api/artists/add-artist'
      const method = isEditMode ? 'PATCH' : 'POST'

      // Add artistId for edit mode
      if (isEditMode && artistData) {
        formData.append('artistId', artistData.id);
      }

      for (const [key, value] of formData.entries()) {
        console.log(`${key}:`, value, 'Type:', typeof value);
      }

      const response = await fetch(url, {
        method: method,
        body: formData,
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to ${isEditMode ? 'update' : 'submit'} artist`)
      }
      const result = await response.json()
      dispatch(showSuccess({
        type: 'artist',
        image: result.data?.artist_image || '',
        name: result.data?.name || '',
        stage_name: result.data?.stage_name || '',
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
          title={isEditMode ? "Edit Artist" : "Add Artist"}
          description={isEditMode ? "Update your artist information" : "Submit a new artist to our platform"}
        >
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="text-gold">Loading artist data...</div>
            </div>
          ) : (
            <SubmissionForm
              formConfig={formConfig}
              onSubmit={handleSubmit}
              isLoading={isSubmitting}
              submitButtonText={isEditMode ? "Update Artist" : "Submit Artist"}
            />
          )}
        </FormContainer>
      </div>
      <div className='w-full lg:w-[35%] lg:min-w-[400px]'>
        <TermsAndConditions type="artist" />
      </div>
    </div>
  )
}

export default AddArtist