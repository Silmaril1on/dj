'use client'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter } from 'next/navigation'
import { hideSuccess } from '@/app/features/successSlice'
import { selectSuccess } from '@/app/features/successSlice'
import { MdCheckCircle, MdLocationOn, MdPerson } from 'react-icons/md'
import { motion } from 'framer-motion'
import Button from '@/app/components/buttons/Button'
import Close from '../buttons/Close'

const SuccessOnSubmit = () => {
  const dispatch = useDispatch()
  const router = useRouter()
  const { type, data } = useSelector(selectSuccess)

  console.log('SuccessOnSubmit - Type:', type)
  console.log('SuccessOnSubmit - Data:', data)
  console.log('SuccessOnSubmit - album_image:', data?.album_image)
  console.log('SuccessOnSubmit - image:', data?.image)
  console.log('SuccessOnSubmit - name:', data?.name)

  const handleClose = () => {
    dispatch(hideSuccess())
    router.push('/')
  }

  const getTypeTitle = () => {
    switch (type) {
      case 'artist':
        return 'Artist Submitted Successfully!'
      case 'club':
        return 'Club Submitted Successfully!'
      case 'event':
        return 'Event Submitted Successfully!'
      case 'artist_date':
        return 'Artist Date Added Successfully!'
      case 'artist_album':
        return 'Album Added Successfully!'
      default:
        return 'Submitted Successfully!'
    }
  }

  const getTypeDescription = () => {
    switch (type) {
      case 'artist':
        return 'Your artist submission is now pending approval. We\'ll review it and get back to you soon! You can check details in your profiles statistics'
      case 'club':
        return 'Your club submission is now pending approval. We\'ll review it and get back to you soon!'
      case 'event':
        return 'Your event submission is now pending approval. We\'ll review it and get back to you soon!'
      case 'artist_date':
        return 'Your artist date has been added successfully! You can now see this date on the artist\'s profile.'
      case 'artist_album':
        return 'Your album has been added successfully! You can now see this album on the artist\'s profile.'
      default:
        return 'Your submission is now pending approval. We\'ll review it and get back to you soon!'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="relative"
    >
      <Close className="absolute top-0 right-0" onClick={handleClose} />
      <div className="text-center p-4 space-y-2">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <div className="w-20 h-20 mx-auto bg-green-900/30 rounded-full flex items-center justify-center">
            <MdCheckCircle className="text-green-500 text-5xl" />
          </div>
        </motion.div>

        {/* Success Title */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-gold"
        >
          {getTypeTitle()}
        </motion.h2>
        {/* Success Description */}
        <div className='center'>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-chino secondary text-xs w-[380px]"
          >
            {getTypeDescription()}
          </motion.p>
        </div>
        {/* Submitted Item Preview - only show for non-artist_date types */}
        {type !== 'artist_date' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-stone-800 border border-gold/20 p-4"
          >
            {/* Image */}
            {(data.image || data.album_image) && (
              <div className="w-24 h-24 mx-auto mb-4 rounded-lg overflow-hidden">
                <img
                  src={data.image || data.album_image}
                  alt={data.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            {/* Name */}
            <h3 className="text-lg font-semibold text-chino mb-2">
              {data.name}
            </h3>

            {/* Stage Name (for artists) */}
            {type === 'artist' && data.stage_name && (
              <p className="text-sm capitalize">
                <MdPerson className="inline mr-1" />
                {data.stage_name}
              </p>
            )}
            {/* Location */}
            {(data.country || data.city) && (
              <p className="text-sm">
                <MdLocationOn className="inline mr-1" />
                {[data.city, data.country].filter(Boolean).join(', ')}
              </p>
            )}
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-3 justify-center mt-5"
        >
          <Button
            text="Go to Home"
            onClick={handleClose}
          />

        </motion.div>
      </div>
    </motion.div>
  )
}

export default SuccessOnSubmit