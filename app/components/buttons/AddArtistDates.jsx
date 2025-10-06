'use client'
import { useDispatch, useSelector } from 'react-redux'
import { selectUser } from '@/app/features/userSlice'
import { setError } from '@/app/features/modalSlice'
import { openAddEventModal } from '@/app/features/modalSlice'
import { MdEvent } from 'react-icons/md'

const AddArtistDates = ({ className, artist, desc, userSubmittedArtistId }) => {
  const dispatch = useDispatch()
  const user = useSelector(selectUser)

  // Check if current user submitted this artist
  const canAddEvent = user && userSubmittedArtistId === artist?.id

  const handleAddEvent = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      dispatch(setError({ message: 'Please login to add events', type: 'error' }))
      return
    }
    if (!canAddEvent) {
      dispatch(setError({ message: 'You can only add events for your own artist profile', type: 'error' }))
      return
    }
    dispatch(openAddEventModal({ artist }))
  }

  if (!canAddEvent) {
    return null
  }

  return (
    <div
      onClick={handleAddEvent}
      className={`bg-gold/30 hover:bg-gold/40 text-gold w-fit secondary center gap-1 cursor-pointer duration-300 p-1 rounded-xs text-[10px] lg:text-sm font-bold ${className}`}
    >
      <MdEvent size={20} />
      {desc && <h1>{desc}</h1>}
    </div>
  )
}

export default AddArtistDates