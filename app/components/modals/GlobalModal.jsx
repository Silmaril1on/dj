"use client";
import { AnimatePresence, motion } from "framer-motion";
import { IoMdClose } from "react-icons/io";
import Button from "@/app/components/buttons/Button";
import Title from "@/app/components/ui/Title";

const GlobalModal = ({
  isOpen,
  onClose,
  title,
  maxWidth = "max-w-2xl",
  onSubmit,
  submitText,
  loading = false,
  disabled = false,
  children,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm px-3 z-50 flex items-center justify-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={`bg-black border border-gold/50 p-5 w-full relative max-h-[90vh] overflow-hidden ${maxWidth}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              {title && <Title text={title} size="lg" />}
              <div
                onClick={onClose}
                className="cursor-pointer text-gold hover:rotate-90 duration-300 text-xl ml-auto"
              >
                <IoMdClose />
              </div>
            </div>

            {/* Content */}
            {children}

            {/* Footer / Primary Action */}
            {onSubmit && submitText && (
              <div className="center mt-5">
                <Button
                  onClick={onSubmit}
                  text={submitText}
                  loading={loading}
                  disabled={disabled || loading}
                />
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GlobalModal;
