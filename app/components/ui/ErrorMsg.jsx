"use client";
import {
  selectError,
  selectErrorType,
  selectErrorAction,
  setError,
} from "@/app/features/modalSlice";
import { capitalizeFirst } from "@/app/helpers/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { IoMdClose } from "react-icons/io";
import Button from "@/app/components/buttons/Button";
import UserVerificationModal from "@/app/components/modals/UserVerificationModal";
import Close from "../buttons/Close";

const ErrorMsg = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const error = useSelector(selectError);
  const errorType = useSelector(selectErrorType);
  const errorAction = useSelector(selectErrorAction);
  const [isVisible, setIsVisible] = useState(true);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      dispatch(setError(""));
    }, 300);
  };

  const handleVerifyClick = () => {
    handleClose();
    setVerifyModalOpen(true);
  };

  const handleLoginClick = () => {
    handleClose();
    router.push("/sign-in");
  };

  useEffect(() => {
    if (error) {
      setIsVisible(true);
      setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          dispatch(setError(""));
        }, 300);
      }, 4000);
    }
  }, [error, dispatch]);

  if (!error && !verifyModalOpen) return null;

  return (
    <>
      <AnimatePresence mode="wait">
        {isVisible && error && (
          <div className="fixed z-50 bottom-5 right-5  center">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className={`pointer-events-auto max-w-72 backdrop-blur-sm font-bold text-cream px-4 py-3 relative ${
                errorType === "success"
                  ? "bg-green-500/30 border-green-400 border"
                  : errorType === "basic"
                    ? "bg-black/50 border border-gold/30 rounded-md"
                    : "bg-crimson/30 border-crimson border"
              }`}
            >
              {/* Close button */}
              <Close className="absolute top-1 right-1" onClick={handleClose} />
              <p className="text-sm text-center pr-3 pointer-events-none">
                {capitalizeFirst(error)}
              </p>
              {/* CTA for basic type */}
              {errorType === "basic" && (
                <div className="mt-3 center">
                  {errorAction === "login" ? (
                    <Button
                      text="Login PLease"
                      size="small"
                      onClick={handleLoginClick}
                    />
                  ) : (
                    <Button
                      text="Verify Account?"
                      size="small"
                      onClick={handleVerifyClick}
                    />
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <UserVerificationModal
        isOpen={verifyModalOpen}
        onClose={() => setVerifyModalOpen(false)}
      />
    </>
  );
};

export default ErrorMsg;
