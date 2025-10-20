"use client"
import { useSelector, useDispatch } from 'react-redux'
import { selectWelcomeModal, closeWelcomeModal } from '@/app/features/welcomeSlice'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import EmailTag from '../ui/EmailTag'
import MotionLogo from '../ui/MotionLogo'
import Motion from '../containers/Motion'
import Paragraph from '../ui/Paragraph'
import Button from '../buttons/Button'

const WelcomeUser = () => {
  const dispatch = useDispatch()
  const router = useRouter()
  const { isOpen, userName, email } = useSelector(selectWelcomeModal)
    


  if (!isOpen) return null

  const handleClose = () => {
    dispatch(closeWelcomeModal())
    router.push('/')
    }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center px-4"
      onClick={handleClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ duration: 0.3 }}
        className="bg-stone-900 border border-gold/50 p-8 max-w-2xl w-full relative flex items-center justify-center flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <h1 className="text-gold text-2xl font-bold">Welcome to SOUNDFOLIO</h1>
        <MotionLogo className="scale-80" />
        <div className="text-center space-y-1 flex flex-col items-center">
          <Motion animation="fade" delay={1}>
                      <h1 className="text-cream text-5xl font-bold">{userName}</h1>
          </Motion>
          <Motion animation="fade" delay={1.5}>
            <EmailTag email={email} />
          </Motion>
                  <Paragraph text="Welcome to Soundfolio — your hub for sound discovery and creative connection. We're excited to have you join our growing community of artists, curators, and listeners." />
                  <Button text="Explore" size="small" onClick={handleClose} />
        </div>
      </motion.div>
    </motion.div>
  );
}

export default WelcomeUser
