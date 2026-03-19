"use client";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { closeAddEventModal } from "@/app/features/modalSlice";
import { showSuccess } from "@/app/features/successSlice";
import SubmissionForm from "@/app/components/forms/SubmissionForm";
import GlobalModal from "./GlobalModal";

const AddEventModal = () => {
  const dispatch = useDispatch();
  const { isOpen, artist, eventData, isEditMode, clubId } = useSelector(
    (state) => state.modal.addEventModal || {},
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const allowedEventTypes = ["event", "festival", "club", "concert"];
  const selectedEventType = allowedEventTypes.includes(eventData?.event_type)
    ? eventData.event_type
    : "";

  const formConfig = {
    initialData:
      isEditMode && eventData
        ? {
            date: eventData.date || "",
            time: eventData.time || "",
            ...(!clubId && {
              country: eventData.country || "",
              city: eventData.city || "",
              club_name: eventData.club_name || "",
            }),
            event_link: eventData.event_link || "",
            event_location: eventData.event_location || "",
            event_title: eventData.event_title || "",
            event_type: selectedEventType,
          }
        : {
            date: "",
            time: "",
            ...(!clubId && { country: "", city: "", club_name: "" }),
            event_link: "",
            event_location: "",
            event_title: "",
            event_type: "",
          },
    fields: {
      date: {
        type: "date",
        label: "Date",
        required: true,
      },
      time: {
        type: "time",
        label: "Time",
        required: true,
      },
      ...(!clubId && {
        country: {
          type: "text",
          label: "Country",
          placeholder: "Enter country",
          required: true,
        },
        city: {
          type: "text",
          label: "City",
          placeholder: "Enter city",
          required: true,
        },
        club_name: {
          type: "text",
          label: "Club / Venue Name",
          placeholder: "Enter club name",
          required: true,
        },
      }),
      event_title: {
        type: "text",
        label: "Event Title",
        placeholder: "Enter event title",
        required: false,
      },
      event_type: {
        type: "select",
        label: "Event Type",
        required: false,
        options: [
          { value: "", label: "Select event type" },
          { value: "event", label: "Event" },
          { value: "festival", label: "Festival" },
          { value: "club", label: "Club" },
          { value: "concert", label: "Concert" },
        ],
      },
      event_link: {
        type: "url",
        label: "Event Link",
        placeholder: "https://example.com/event",
        required: false,
      },
      event_location: {
        type: "text",
        label: "Event Location",
        placeholder: "https://www.google.com/maps?q=...",
        required: false,
      },
    },
    sections: [
      {
        fields: ["date", "time"],
        gridClass: "grid grid-cols-2 gap-4",
      },
      ...(!clubId
        ? [
            {
              fields: ["country", "city"],
              gridClass: "grid grid-cols-2 gap-4",
            },
            {
              fields: ["club_name", "event_title", "event_type"],
              gridClass: "grid grid-cols-3 gap-4",
            },
          ]
        : [
            {
              fields: ["event_title", "event_type"],
              gridClass: "grid grid-cols-2 gap-4",
            },
          ]),
      {
        fields: ["event_link", "event_location"],
        gridClass: "grid grid-cols-1 gap-4",
      },
    ],
  };

  const handleSubmit = async (formDataToSend) => {
    setIsSubmitting(true);
    try {
      // Convert FormData to regular object for processing
      const formData = {};
      for (let [key, value] of formDataToSend.entries()) {
        formData[key] = value;
      }

      let response;

      if (isEditMode && eventData) {
        // Update existing event
        // Club context — use the club-dates API
        if (clubId) {
          response = await fetch(`/api/club/club-dates?id=${eventData.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          });
        } else if (
          typeof eventData.id === "string" &&
          eventData.id.startsWith("evt-")
        ) {
          const realEventId = eventData.id.replace("evt-", "");
          console.log("🔄 Editing transformed event:", {
            originalId: eventData.id,
            realEventId,
            eventData,
          });

          const fd = new FormData();
          fd.append("eventId", realEventId);
          // Map modal fields to events table fields where appropriate
          fd.append("date", formData.date || "");
          if (formData.time) fd.append("doors_open", formData.time);
          if (formData.country) fd.append("country", formData.country);
          if (formData.city) fd.append("city", formData.city);
          if (formData.club_name) fd.append("venue_name", formData.club_name);
          if (formData.event_location)
            fd.append("location_url", formData.event_location);
          else if (formData.event_link)
            fd.append("location_url", formData.event_link);
          if (formData.event_title)
            fd.append("event_name", formData.event_title);
          if (formData.event_type) fd.append("event_type", formData.event_type);

          response = await fetch(`/api/events`, {
            method: "PATCH",
            body: fd,
          });
        } else {
          response = await fetch(`/api/artists/schedule?id=${eventData.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
          });
        }
      } else {
        // Create new event
        response = await fetch(`/api/artists/schedule`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            artistId: artist.id,
            events: [formData],
          }),
        });
      }

      if (!response.ok) {
        let errorMessage = `Failed to ${isEditMode ? "update" : "add"} event`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // keep fallback message when response is not JSON
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      dispatch(
        showSuccess({
          type: "artist_date",
          message: `Artist date ${isEditMode ? "updated" : "added"} successfully!`,
          data: result.data,
        }),
      );
      dispatch(closeAddEventModal());

      // Reload page to refresh schedule data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error(
        `Error ${isEditMode ? "updating" : "adding"} event:`,
        error,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    dispatch(closeAddEventModal());
  };

  return (
    <GlobalModal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditMode ? "Edit Event" : "Add Event"}
      maxWidth="max-w-2xl"
    >
      <SubmissionForm
        formConfig={formConfig}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
        submitButtonText={isEditMode ? "Update Event" : "Add Event"}
        showGoogle={false}
      />
    </GlobalModal>
  );
};

export default AddEventModal;
