"use client"
import { AnimatePresence, motion } from 'framer-motion'
import NavLinks from '../navigation/components/NavLinks'
import Close from '@/app/components/buttons/Close'
import Logo from '@/app/components/ui/Logo'

const SideBar = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: 0 }}
          exit={{ x: "-100%" }}
          transition={{ duration: 0.4 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 center flex-col"
        >
          <Close className="absolute top-5 right-5" onClick={onClose} />
           <Logo size="lg" className="absolute bottom-20 sepia blur-[3px] opacity-70 rotate-[45deg] scale-200" />
          <div className='flex flex-col items-center' onClick={(e) => e.stopPropagation()}>
            <NavLinks type="sidebar" onClose={onClose} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SideBar