'use client'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { closeAddAlbumModal, selectAddAlbumModal } from '@/app/features/modalSlice'
import { showSuccess } from '@/app/features/successSlice'
import { setError } from '@/app/features/modalSlice'
import SubmissionForm from '@/app/components/forms/SubmissionForm'
import Close from '@/app/components/buttons/Close'
import Title from '@/app/components/ui/Title'
import { formConfigs } from '@/app/helpers/formData/formConfigs'

const AddAlbumModal = () => {
  const dispatch = useDispatch()
  const { isOpen, artist } = useSelector(selectAddAlbumModal) || {}
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (formData) => {
    setIsSubmitting(true)
    try {
      formData.append('type', 'artist_album')
      const response = await fetch(`/api/artists/${artist.id}`, {
        method: 'PUT',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add album')
      }

      const result = await response.json()
      console.log('API Response:', result)
      console.log('Album data:', result.data)
      console.log('Album image:', result.data?.album_image)
      console.log('Album name:', result.data?.name)
      
      const successData = {
        type: 'artist_album',
        image: result.data?.album_image || '',
        album_image: result.data?.album_image || '',
        name: result.data?.name || ''
      }
      console.log('Dispatching showSuccess with:', successData)
      
      dispatch(showSuccess(successData))
      dispatch(closeAddAlbumModal())
      
      // Don't reload immediately - let user see the success modal
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      console.error('Error adding album:', error)
      dispatch(setError({ message: error.message, type: 'error' }))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    dispatch(closeAddAlbumModal())
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-gold/30 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <Title text="Add Album" size="lg" color="gold" />
            <Close onClick={handleClose} />
          </div>
          <SubmissionForm
            formConfig={formConfigs.addArtistAlbum}
            onSubmit={handleSubmit}
            isLoading={isSubmitting}
            submitButtonText="Add Album"
            showGoogle={false}
          />
        </div>
      </div>
    </div>
  )
}

export default AddAlbumModal
