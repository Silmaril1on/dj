"use client"
import { AnimatePresence, motion } from 'framer-motion'
import NavLinks from '../navigation/components/NavLinks'
import Close from '@/app/components/buttons/Close'
import Logo from '@/app/components/ui/Logo'
import { selectUser } from '@/app/features/userSlice'
import { useSelector } from 'react-redux'
import AuthButtons from '@/app/components/buttons/AuthButtons'

const SideBar = ({ isOpen, onClose }) => {
  const user = useSelector(selectUser)

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: 0 }}
          exit={{ x: "-100%" }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 center flex-col"
        >
          <Close className="absolute top-5 right-5" onClick={onClose} />
          <Logo size="lg" className="absolute top-30 sepia blur-[3px] opacity-70 rotate-[45deg] scale-200" />
          <div className='flex flex-col items-center' onClick={(e) => e.stopPropagation()}>
            <NavLinks type="sidebar" onClose={onClose} />
          </div>
          <div className=' absolute bottom-5'>
            {!user && <AuthButtons />}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SideBar