'use client'
import { selectAddEventModal, selectGlobalModal } from '@/app/features/modalSlice';
import { selectSuccess } from '@/app/features/successSlice';
import { selectEvaluationModal } from '@/app/features/evaluationSlice';
import { selectReportsModal } from '@/app/features/reportsSlice';
import { selectBookingModal, selectAcceptBookingModal } from '@/app/features/bookingSlice'; 
import { selectPrivacyTermsModal } from '@/app/features/privacyTermsSlice';
import { useSelector } from 'react-redux'
import { AnimatePresence, motion } from 'framer-motion'
import RatingModal from './RatingModal'
import ReviewModal from './ReviewModal'
import SuccessOnSubmit from '@/app/components/materials/SuccessOnSubmit'
import ViewSubmittedInfo from '@/app/components/materials/ViewSubmittedInfo';
import AddEventModal from './AddEventModal';
import ReportForm from '../forms/ReportForm';
import BookingForm from '../forms/BookingForm';
import AcceptBookingModal from './AcceptBookingModal';
import PrivacyAndTermsModal from './PrivacyAndTermsModal';

const GlobalModal = ({ children, }) => {
  const globalModal = useSelector(selectGlobalModal);
  const successModal = useSelector(selectSuccess);
  const evaluationModal = useSelector(selectEvaluationModal);
  const addEventModal = useSelector(selectAddEventModal);
  const reportsModal = useSelector(selectReportsModal);
  const bookingModal = useSelector(selectBookingModal);
  const acceptBookingModal = useSelector(selectAcceptBookingModal); 
  const privacyTermsModal = useSelector(selectPrivacyTermsModal);

  const getModalWidth = () => {
    if (acceptBookingModal?.isOpen) return "w-2xl";
    if (bookingModal?.isOpen) return "w-full lg:w-[60%]"; 
    if (addEventModal?.isOpen) return "max-w-3xl";
    if (globalModal.content === "rating") return "w-lg";
    if (globalModal.content === "review") return "w-xl";
    if (reportsModal?.isOpen) return "w-xl";
    if (privacyTermsModal?.isOpen) return "max-w-4xl";
    return "max-w-2xl"; 
  };

  return (
    <AnimatePresence>
      {(globalModal.isOpen ||
        successModal.isOpen ||
        evaluationModal ||
        addEventModal?.isOpen ||
        reportsModal?.isOpen ||
        bookingModal?.isOpen ||
        acceptBookingModal?.isOpen ||
        privacyTermsModal?.isOpen) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={`fixed inset-0 bg-black/50 backdrop-blur-sm px-3 z-50 flex items-center justify-center `}
        >
          <div
            className={`bg-black border border-gold/50 p-5 relative ${getModalWidth()}`}
          >
            {globalModal.isOpen && globalModal.content === "rating" && (
              <RatingModal />
            )}
            {globalModal.isOpen && globalModal.content === "review" && (
              <ReviewModal />
            )}
            {successModal.isOpen && <SuccessOnSubmit />}
            {evaluationModal && <ViewSubmittedInfo />}
            {addEventModal?.isOpen && <AddEventModal />}
            {reportsModal?.isOpen && <ReportForm type={reportsModal.type} />}
            {bookingModal?.isOpen && <BookingForm />}
            {acceptBookingModal?.isOpen && <AcceptBookingModal />}
            {privacyTermsModal?.isOpen && <PrivacyAndTermsModal />}
          </div>
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default GlobalModal