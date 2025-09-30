'use client'
import { selectAddEventModal, selectGlobalModal } from '@/app/features/modalSlice';
import { selectSuccess } from '@/app/features/successSlice';
import { selectEvaluationModal } from '@/app/features/evaluationSlice';
import { selectReportsModal } from '@/app/features/reportsSlice';
import { useSelector } from 'react-redux'
import { AnimatePresence, motion } from 'framer-motion'
import RatingModal from './RatingModal'
import ReviewModal from './ReviewModal'
import SuccessOnSubmit from '@/app/components/materials/SuccessOnSubmit'
import ViewSubmittedInfo from '@/app/components/materials/ViewSubmittedInfo';
import AddEventModal from './AddEventModal';
import ReportForm from '../forms/ReportForm';

const GlobalModal = ({ children, className = "" }) => {
  const globalModal = useSelector(selectGlobalModal);
  const successModal = useSelector(selectSuccess);
  const evaluationModal = useSelector(selectEvaluationModal);
  const addEventModal = useSelector(selectAddEventModal);
  const reportsModal = useSelector(selectReportsModal);

  return (
    <AnimatePresence>
      {(globalModal.isOpen || successModal.isOpen || evaluationModal || addEventModal?.isOpen || reportsModal?.isOpen) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center ${className}`}
        >
          <div className="bg-black border border-gold/50 p-6 min-w-lg max-w-2xl w-full mx-4 relative">
            {globalModal.isOpen && globalModal.content === 'rating' && <RatingModal />}
            {globalModal.isOpen && globalModal.content === 'review' && <ReviewModal />}
            {successModal.isOpen && <SuccessOnSubmit />}
            {evaluationModal && <ViewSubmittedInfo />}
            {addEventModal?.isOpen && <AddEventModal />}
            {reportsModal?.isOpen && <ReportForm type={reportsModal.type} />}
          </div>
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default GlobalModal