"use client";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import { closeAddClubDateModal, setError } from "@/app/features/modalSlice";
import { showSuccess } from "@/app/features/successSlice";
import Close from "@/app/components/buttons/Close";
import Title from "@/app/components/ui/Title";
import SubmissionForm from "@/app/components/forms/SubmissionForm";

const AddClubDateModal = () => {
  const dispatch = useDispatch();
  const { isOpen, club } = useSelector(
    (state) => state.modal.addClubDateModal || {},
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formConfig = {
    initialData: {
      date: "",
      time: "",
      event_link: "",
      event_title: "",
      minimum_age: "",
      lineup: [""],
    },
    arrayFields: ["lineup"],
    fields: {
      date: {
        type: "date",
        label: "Date",
        required: true,
      },
      time: {
        type: "time",
        label: "Time",
        required: false,
      },
      event_title: {
        type: "text",
        label: "Event Title",
        placeholder: "Enter event title",
        required: true,
      },
      minimum_age: {
        type: "text",
        label: "Minimum Age",
        placeholder: "e.g., 18",
        required: false,
        inputMode: "numeric",
        pattern: "[0-9]*",
      },
      event_link: {
        type: "url",
        label: "Event Link",
        placeholder: "https://example.com/event",
        required: false,
      },
      lineup: {
        type: "additional",
        required: false,
        label: "Lineup",
        placeholder: "Add artist name",
      },
    },
    sections: [
      {
        fields: ["date", "time", "minimum_age"],
        gridClass: "grid grid-cols-1 md:grid-cols-3 gap-4",
      },
      {
        fields: ["event_title", "event_link"],
        gridClass: "grid grid-cols-1 md:grid-cols-2 gap-4",
      },
      {
        fields: ["lineup"],
        gridClass: "grid grid-cols-1 gap-4",
      },
    ],
  };

  const handleSubmit = async (formData) => {
    if (!club?.id) {
      dispatch(setError({ message: "Club data is missing", type: "error" }));
      return;
    }

    setIsSubmitting(true);
    dispatch(setError(""));

    try {
      const response = await fetch(`/api/club/${club.id}/club-dates`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to add event date");
      }

      dispatch(
        showSuccess({
          type: "club_date",
          message: "Club event date added successfully",
          data: result.data,
        }),
      );
      dispatch(closeAddClubDateModal());

      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (error) {
      dispatch(setError({ message: error.message, type: "error" }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    dispatch(closeAddClubDateModal());
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="bg-black border border-gold/30 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <Title text="Add Event" size="lg" />
                <Close onClick={handleClose} />
              </div>

              <SubmissionForm
                formConfig={formConfig}
                onSubmit={handleSubmit}
                isLoading={isSubmitting}
                submitButtonText="Add Event"
                showGoogle={false}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddClubDateModal;
