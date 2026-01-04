"use client";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { closeAddEventModal } from "@/app/features/modalSlice";
import { showSuccess } from "@/app/features/successSlice";
import Close from "@/app/components/buttons/Close";
import Title from "@/app/components/ui/Title";
import SubmissionForm from "@/app/components/forms/SubmissionForm";

const AddEventModal = () => {
  const dispatch = useDispatch();
  const { isOpen, artist, eventData, isEditMode } = useSelector(
    (state) => state.modal.addEventModal || {}
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formConfig = {
    initialData:
      isEditMode && eventData
        ? {
            date: eventData.date || "",
            time: eventData.time || "",
            country: eventData.country || "",
            city: eventData.city || "",
            club_name: eventData.club_name || "",
            event_link: eventData.event_link || "",
            event_title: eventData.event_title || "",
            event_type: eventData.event_type || "",
            event_image: eventData.event_image || "",
          }
        : {
            date: "",
            time: "",
            country: "",
            city: "",
            club_name: "",
            event_link: "",
            event_title: "",
            event_type: "",
            event_image: "",
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
          { value: "club night", label: "Club Night" },
          { value: "concert", label: "Concert" },
        ],
      },
      event_link: {
        type: "url",
        label: "Event Link",
        placeholder: "https://example.com/event",
        required: false,
      },
      event_image: {
        type: "url",
        label: "Event Image URL",
        placeholder: "https://example.com/image.jpg",
        required: false,
      },
    },
    sections: [
      {
        fields: ["date", "time"],
        gridClass: "grid grid-cols-2 gap-4",
      },
      {
        fields: ["country", "city"],
        gridClass: "grid grid-cols-2 gap-4",
      },
      {
        fields: ["club_name", "event_title", "event_type"],
        gridClass: "grid grid-cols-3 gap-4",
      },
      {
        fields: ["event_link", "event_image"],
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
        // If the event is a transformed event from the `events` table
        // we created an id like `evt-<eventId>` in the schedule API. Handle
        // that by sending a PATCH to /api/events with a FormData payload.
        if (
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
          if (formData.event_link)
            fd.append("location_url", formData.event_link);
          if (formData.event_title)
            fd.append("event_name", formData.event_title);
          if (formData.event_type) fd.append("event_type", formData.event_type);
          if (formData.event_image)
            fd.append("event_image", formData.event_image);

          response = await fetch(`/api/events`, {
            method: "PATCH",
            body: fd,
          });
        } else {
          response = await fetch(`/api/artists/schedule/${eventData.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
          });
        }
      } else {
        // Create new event
        response = await fetch(`/api/artists/${artist.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            type: "artist_date",
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to ${isEditMode ? "update" : "add"} event`
        );
      }

      const result = await response.json();
      dispatch(
        showSuccess({
          type: "artist_date",
          message: `Artist date ${isEditMode ? "updated" : "added"} successfully!`,
          data: result.data,
        })
      );
      dispatch(closeAddEventModal());

      // Reload page to refresh schedule data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error(
        `Error ${isEditMode ? "updating" : "adding"} event:`,
        error
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    dispatch(closeAddEventModal());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-gold/30 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <Title text={isEditMode ? "Edit Event" : "Add Event"} size="lg" />
            <Close onClick={handleClose} />
          </div>

          <SubmissionForm
            formConfig={formConfig}
            onSubmit={handleSubmit}
            isLoading={isSubmitting}
            submitButtonText={isEditMode ? "Update Event" : "Add Event"}
            showGoogle={false}
          />
        </div>
      </div>
    </div>
  );
};

export default AddEventModal;
