'use client'
import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { closeEventRequestModal, selectEventRequestModal, removeRequest, openEventRequestModal } from '@/app/features/eventRequestSlice'
import { MdCalendarToday, MdAccessTime, MdCheckCircle, MdCancel } from 'react-icons/md'
import ArtistCountry from '@/app/components/materials/ArtistCountry'
import Title from '@/app/components/ui/Title'
import Button from '@/app/components/buttons/Button'
import Close from '@/app/components/buttons/Close'
import { formatBirthdate } from '@/app/helpers/utils'
import {motion, AnimatePresence} from 'framer-motion'

const EventRequestModal = () => {
  const dispatch = useDispatch()
  const { requests, isOpen } = useSelector(selectEventRequestModal)
  const [loading, setLoading] = useState(null)

  useEffect(() => {
    const fetchPendingEvents = async () => {
      try {
        const response = await fetch('/api/users/artist-event-request')
        const result = await response.json()
        if (result.success && result.data && result.data.length > 0) {
          dispatch(openEventRequestModal({ requests: result.data }))
        } else {
          console.log('⚠️ No pending events found')
        }
      } catch (error) {
        console.error('❌ Error fetching pending events:', error)
      }
    }

    fetchPendingEvents()
  }, [dispatch])

  const handleClose = () => {
    dispatch(closeEventRequestModal())
  }

  const handleAction = async (scheduleId, action) => {
    setLoading(scheduleId)
    try {
      const response = await fetch('/api/users/artist-event-request', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scheduleId, action }),
      })
      const result = await response.json()
      if (result.success) {
        dispatch(removeRequest(scheduleId))
        dispatch(setError({ message: `Event ${action}d successfully`, type: 'success' }))
        if (requests.length === 1) {
          dispatch(closeEventRequestModal())
        }
      } else {
        console.error('Failed to process request:', result.error)
        alert(`Failed to ${action} event: ${result.error}`)
      }
    } catch (error) {
      console.error('Error processing request:', error)
      alert(`Error: ${error.message}`)
    } finally {
      setLoading(null)
    }
  }

  return (
   <AnimatePresence>
    {isOpen &&  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="overflow-y-auto fixed inset-0 z-50 bg-black/70 backdrop-blur-sm center">
      <div className="bg-black border border-gold/40 p-5 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
      <Close className="absolute top-4 right-4 z-10" onClick={handleClose} />
      <div className="mb-6">
        <Title text="Event Requests" size="xl" color="gold" />
        <p className="text-chino/80 text-sm mt-2">
          You have {requests.length} pending event request{requests.length !== 1 ? 's' : ''}. By approving, the event will be added to your schedule.
        </p>
      </div>

      <div className="space-y-4">
          {requests.map((schedule) => (
            <div
              key={schedule.id}
              className="bg-stone-900 lg:py-2 px-2 lg:px-2 bordered"
            >
              <div className="grid grid-cols-2 lg:grid-cols-[4fr_2fr] items-center">
                <section className='grid grid-cols-1 lg:grid-cols-3 gap-1 lg:gap-0'>
                  {/* Date */}
                  <div className="flex items-center gap-2 text-gold pointer-events-none">
                    <MdCalendarToday size={18} />
                    <span className="font-semibold text-xs lg:text-lg">
                      {formatBirthdate(schedule.date)}
                    </span>
                  </div>
                  {/* Time */}
                  <div className="flex justify-start lg:justify-center items-center gap-2 text-xs lg:text-base text-chino font-bold pointer-events-none">
                    <MdAccessTime />
                    <span>{schedule.time}</span>
                  </div>
                  {/* Location */}
                  <div className="flex justify-start lg:justify-center items-center gap-2 text-chino pointer-events-none">
                    <ArtistCountry
                      artistCountry={{
                        country: schedule.country,
                        city: schedule.city,
                      }}
                    />
                  </div>
                </section>

                {/* Club/Venue Name */}
                <div className="flex flex-col items-end justify-evenly">
                  <Title text={schedule.club_name} />
                  {schedule.event_link && (
                    <a
                      href={schedule.event_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gold/70 hover:text-gold text-xs underline mt-1 inline-block"
                    >
                      View Event Details
                    </a>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3 mt-3 border-t border-gold/20">
                <Button
                  text="Approve"
                  type="success"
                  icon={<MdCheckCircle />}
                  onClick={() => handleAction(schedule.id, 'approve')}
                  disabled={loading === schedule.id}
                />
                <Button
                  text="Decline"
                  type="remove"
                  icon={<MdCancel />}
                  onClick={() => handleAction(schedule.id, 'decline')}
                  disabled={loading === schedule.id}
                />
              </div>
            </div>
          ))}
      </div>
      </div>
    </motion.div>}
   </AnimatePresence>
  )
}

export default EventRequestModal