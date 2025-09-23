'use client'
import { selectError, selectErrorType, setError } from '@/app/features/modalSlice'
import { capitalizeFirst } from '@/app/helpers/utils'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

const ErrorMsg = () => {
  const dispatch = useDispatch()
  const error = useSelector(selectError)
  const errorType = useSelector(selectErrorType)
  const [isVisible, setIsVisible] = useState(false)

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => {
      dispatch(setError(""));
    }, 300);
  };

  useEffect(() => {
    if (error) {
      setIsVisible(true)
      setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => {
          dispatch(setError(""));
        }, 300);
      }, 4000);
    }
  }, [error, dispatch]);

  if (!error) return null

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          onClick={handleClose}
          initial={{ opacity: 0, y: 20, scale: 0.90 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.90 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={`px-4 py-2 z-50 fixed cursor-pointer top-16 font-bold right-10 text-cream  ${errorType === 'success' ? ' bg-green-700' : ' bg-crimson'}`}
        >
          <p className="text-sm">{capitalizeFirst(error)}</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ErrorMsg