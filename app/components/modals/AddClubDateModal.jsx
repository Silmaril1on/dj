"use client";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { closeAddClubDateModal, setError } from "@/app/features/modalSlice";
import { showSuccess } from "@/app/features/successSlice";
import SubmissionForm from "@/app/components/forms/SubmissionForm";
import GlobalModal from "./GlobalModal";

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
      const response = await fetch(`/api/club/club-dates?clubId=${club.id}`, {
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
    <GlobalModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Event"
      maxWidth="max-w-2xl"
    >
      <SubmissionForm
        formConfig={formConfig}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
        submitButtonText="Add Event"
        showGoogle={false}
      />
    </GlobalModal>
  );
};

export default AddClubDateModal;
