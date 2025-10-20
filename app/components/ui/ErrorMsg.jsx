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
  const [isVisible, setIsVisible] = useState(true)


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
        <div className="bg-black fixed z-50 top-16 right-10">
          <motion.div
            onClick={handleClose}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={` cursor-pointer font-bold text-cream px-4 py-2  ${
              errorType === "success"
                ? " bg-green-500/30 border-green-400 border"
                : " bg-crimson/30 border-crimson border"
            }`}
          >
            <p className="text-sm">{capitalizeFirst(error)}</p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default ErrorMsg