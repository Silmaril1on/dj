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
    if (!formData.content.trim()) {
      dispatch(setAcceptBookingError('Message is required'))
      return
    }
    if (!bookingData) {
      dispatch(setAcceptBookingError('No booking data available'))
      return
    }

    dispatch(setAcceptBookingLoading(true))
    try {
      const responseData = {
        message: formData.content.trim(), 
        requester_id: bookingData.requester_id || bookingData.requester?.id,
        booking_id: bookingData.id 
      }

      console.log("Sending data:", responseData);

      const response = await fetch('/api/booking-requests/chat', { 
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
      setFormData({ content: '' })
      router.push("/")
    } catch (error) {
      dispatch(setAcceptBookingError(error.message))
    } finally {
      dispatch(setAcceptBookingLoading(false))
    }
  }

  const handleClose = () => {
    dispatch(closeAcceptBookingModal())
    setFormData({ content: '' })
  }

  if (!bookingData) return null

  return (
    <div className="relative space-y-4">
      <Close className="absolute top-2 right-2" onClick={handleClose} />
      <div>
        <Title text="Start Booking Discussion" size="lg"/>
        <Paragraph 
          text={`Send your first message about: ${bookingData.event_name}`}
          className="text-stone-400"
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Content Input */}
        <div>
          <label>Message</label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            placeholder="Start the discussion about this booking request. Add any details, requirements, or questions..."
            rows={4}
            disabled={loading}
          />
        </div>

        <div className="bg-stone-900 p-3 border border-gold/30 rounded-sm">
          <Paragraph text="Booking Summary:" className="text-gold mb-2" />
          <div className="text-sm text-cream space-y-1">
            <div>Event: {bookingData.event_name}</div>
            <div>Venue: {bookingData.venue_name}</div>
            <div>Date: {new Date(bookingData.event_date).toLocaleDateString()}</div>
            <div>Requester: {bookingData.requester?.full_name || bookingData.requester?.userName || 'Unknown'}</div>
          </div>
        </div>

        <Button
          type="submit"
          loading={loading}
          text={loading ? "Starting Discussion..." : "Start Discussion"}
          disabled={loading || !formData.content.trim()}
        />
      </form>
    </div>
  )
}

export default AcceptBookingModal