'use client'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { closeAddEventModal } from '@/app/features/modalSlice'
import { showSuccess } from '@/app/features/successSlice'
import Button from '@/app/components/buttons/Button'
import Close from '@/app/components/buttons/Close'
import Title from '@/app/components/ui/Title'
import { MdEvent, MdLocationOn, MdAccessTime, MdCalendarToday } from 'react-icons/md'

const AddEventModal = () => {
  const dispatch = useDispatch()
  const { isOpen, artist } = useSelector(state => state.modal.addEventModal || {})
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    country: '',
    city: '',
    club_name: '',
    event_link: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/artists/${artist.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          type: 'artist_date'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add event')
      }

      const result = await response.json()
      dispatch(showSuccess({
        type: 'artist_date',
        message: 'Artist date added successfully!',
        data: result.data
      }))
      dispatch(closeAddEventModal())
      setFormData({
        date: '',
        time: '',
        country: '',
        city: '',
        club_name: '',
        event_link: ''
      })
    } catch (error) {
      console.error('Error adding event:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    dispatch(closeAddEventModal())
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-gold/30 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <Title text="Add Event" size="lg" />
            <Close onClick={handleClose} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label ><MdCalendarToday className="inline mr-2" />Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <label><MdAccessTime className="inline mr-2" />Time</label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label> <MdLocationOn className="inline mr-2" />Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  placeholder="Enter country"
                  required
                />
              </div>

              <div>
                <label><MdLocationOn className="inline mr-2" />City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="Enter city"
                  required
                />
              </div>
            </div>

            <div>
              <label><MdEvent className="inline mr-2" />Club / Venue Name</label>
              <input
                type="text"
                name="club_name"
                value={formData.club_name}
                onChange={handleInputChange}
                placeholder="Enter club name"
                required
              />
            </div>

            <div>
              <label>Event Link (Optional)</label>
              <input
                type="url"
                name="event_link"
                value={formData.event_link}
                onChange={handleInputChange}
                placeholder="https://example.com/event"
              />
            </div>

            <Button
              type="submit"
              text="Add Event"
              loading={isSubmitting}
            />
          </form>
        </div>
      </div>
    </div>
  )
}

export default AddEventModal