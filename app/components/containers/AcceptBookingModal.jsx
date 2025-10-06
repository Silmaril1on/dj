"use client"
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { 
  selectAcceptBookingModal, 
  closeAcceptBookingModal, 
  setAcceptBookingLoading,
  setAcceptBookingError 
} from '@/app/features/bookingSlice'
import { setError } from '@/app/features/modalSlice'
import Title from '@/app/components/ui/Title'
import Paragraph from '@/app/components/ui/Paragraph'
import Close from '@/app/components/buttons/Close'
import Button from '@/app/components/buttons/Button'
import { useRouter } from 'next/navigation'

const AcceptBookingModal = () => {
    const dispatch = useDispatch()
    const router = useRouter()
  const { bookingData, loading } = useSelector(selectAcceptBookingModal)
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      dispatch(setAcceptBookingError('Title is required'))
      return
    }
    if (!bookingData) {
      dispatch(setAcceptBookingError('No booking data available'))
      return
    }
    dispatch(setAcceptBookingLoading(true))
    try {
      const responseData = {
        title: formData.title.trim(),
        content: formData.content.trim() || null,
        requester_id: bookingData.requester_id || bookingData.requester?.id,
        booking_request_id: bookingData.id
      }
      const response = await fetch('/api/booking-requests/booking-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(responseData),
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send booking response')
      }
      dispatch(setError({
        message: "Booking response sent successfully! The requester will be notified.",
        type: "success"
      }))
      dispatch(closeAcceptBookingModal())
      setFormData({ title: '', content: '' })
      router.push("/")
    } catch (error) {
      dispatch(setError(error.message))
    } finally {
      dispatch(setAcceptBookingLoading(false))
    }
  }

  const handleClose = () => {
    dispatch(closeAcceptBookingModal())
    setFormData({ title: '', content: '' })
  }

  if (!bookingData) return null

  return (
    <div className="relative space-y-4">
          <Close className="absolute top-2 right-2" onClick={handleClose}  />
        <div>
          <Title text="Discuss Booking Request" size="lg"/>
          <Paragraph 
            text={`Responding to: ${bookingData.event_name}`}
            className="text-stone-400"
          />
        </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label>Response Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="e.g., Booking Accepted - Let's discuss details"
            required
            disabled={loading}
          />
        </div>

        {/* Content Input */}
        <div>
          <label> Message</label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            placeholder="Add any details, requirements, or questions about the booking..."
            rows={4}
            disabled={loading}
          />
        </div>

        <div className="bg-stone-900 p-2 border border-gold/30">
          <Paragraph text="Booking Summary:" />
          <div className="text-sm text-cream">
            <div>Event: {bookingData.event_name}</div>
            <div>Venue: {bookingData.venue_name}</div>
            <div>Date: {new Date(bookingData.event_date).toLocaleDateString()}</div>
            <div>Requester: {bookingData.requester?.full_name || bookingData.requester?.userName}</div>
          </div>
        </div>

          <Button
                  type="submit"
                  loading={loading}
            text={loading ? "Sending Response..." : "Send Response"}
            disabled={loading || !formData.title.trim()}
          />
      </form>
    </div>
  )
}

export default AcceptBookingModal