"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { IoAlarmOutline, IoAlarm } from "react-icons/io5";
import { selectUser } from "@/app/features/userSlice";
import { setError } from "@/app/features/modalSlice";
import ActionButton from "@/app/components/buttons/ActionButton";

const ALL_REMINDER_OPTIONS = [
  { value: 3, label: "3 days earlier" },
  { value: 7, label: "1 week earlier" },
  { value: 14, label: "2 weeks earlier" },
  { value: 30, label: "1 month earlier" },
];

/** Returns how many whole days until the event date (0 if today or past). */
function daysUntil(dateValue) {
  if (!dateValue) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(dateValue);
  eventDate.setHours(0, 0, 0, 0);
  const diff = Math.floor((eventDate - today) / (1000 * 60 * 60 * 24));
  return diff;
}

const ReminderButton = ({ className, event, onReminderChange, desc, size }) => {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isReminderSet, setIsReminderSet] = useState(
    event?.isReminderSet || false,
  );
  const [selectedOffset, setSelectedOffset] = useState(
    event?.reminderOffsetDays || 3,
  );
  const wrapperRef = useRef(null);

  useEffect(() => {
    setIsReminderSet(event?.isReminderSet || false);
    setSelectedOffset(event?.reminderOffsetDays || 3);
  }, [event?.isReminderSet, event?.reminderOffsetDays]);

  useEffect(() => {
    const handleOutsideClick = (targetEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(targetEvent.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Only show reminder options whose lead-time fits before the event
  const days = daysUntil(event?.date);
  const availableOptions = useMemo(() => {
    if (days === null) return ALL_REMINDER_OPTIONS;
    return ALL_REMINDER_OPTIONS.filter((opt) => opt.value < days);
  }, [days]);

  const activeLabel = useMemo(() => {
    return ALL_REMINDER_OPTIONS.find((item) => item.value === selectedOffset)
      ?.label;
  }, [selectedOffset]);

  const handleToggleMenu = (clickEvent) => {
    clickEvent.preventDefault();
    clickEvent.stopPropagation();

    if (!user) {
      dispatch(
        setError({ message: "Please login to set reminder", type: "error" }),
      );
      return;
    }

    if (loading) return;
    setIsOpen((prev) => !prev);
  };

  const handleSetReminder = async (offsetDays) => {
    if (loading) return;

    setLoading(true);
    try {
      const response = await fetch("/api/events/event-reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          reminderOffsetDays: offsetDays,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Failed to set reminder");
      }

      setSelectedOffset(data.reminderOffsetDays || offsetDays);
      setIsReminderSet(Boolean(data.isReminderSet));
      onReminderChange?.(
        Boolean(data.isReminderSet),
        data.reminderOffsetDays || offsetDays,
      );
      setIsOpen(false);
    } catch (error) {
      dispatch(
        setError({
          message:
            error instanceof Error ? error.message : "Failed to set reminder",
          type: "error",
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveReminder = async (clickEvent) => {
    clickEvent.preventDefault();
    clickEvent.stopPropagation();
    if (loading) return;

    setLoading(true);
    try {
      const response = await fetch("/api/events/event-reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: event.id, action: "remove" }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(data.error || "Failed to remove reminder");

      setIsReminderSet(false);
      setSelectedOffset(3);
      onReminderChange?.(false, null);
      setIsOpen(false);
    } catch (error) {
      dispatch(
        setError({
          message:
            error instanceof Error
              ? error.message
              : "Failed to remove reminder",
          type: "error",
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <ActionButton
        onClick={handleToggleMenu}
        icon={
          isReminderSet ? (
            <IoAlarm size={size} />
          ) : (
            <IoAlarmOutline size={size} />
          )
        }
        text={desc}
        loading={loading}
        active={isReminderSet}
        authMessage="Please login to set reminder"
        className={className}
      />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-[110%] z-40 min-w-[185px] rounded-sm border border-gold/30 bg-black/95 p-1.5 shadow-xl"
          >
            {availableOptions.length === 0 ? (
              <p className="text-[11px] text-stone-400 px-2 py-1.5">
                No reminder options available for this event.
              </p>
            ) : (
              availableOptions.map((option) => {
                const isSelected =
                  selectedOffset === option.value && isReminderSet;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={(clickEvent) => {
                      clickEvent.preventDefault();
                      clickEvent.stopPropagation();
                      handleSetReminder(option.value);
                    }}
                    className={`w-full text-left px-2 py-1 text-xs duration-200 rounded-sm ${isSelected ? "bg-gold/20 text-gold" : "text-chino hover:bg-gold/10 hover:text-gold"}`}
                  >
                    {option.label}
                  </button>
                );
              })
            )}

            {isReminderSet && activeLabel && (
              <div className="px-2 pt-1.5 pb-0.5 border-t border-gold/10 mt-1">
                <p className="text-[10px] text-stone-400">
                  Active: {activeLabel}
                </p>
                <button
                  type="button"
                  onClick={handleRemoveReminder}
                  className="text-[10px] text-red-400 hover:text-red-300 mt-0.5 transition-colors duration-150"
                >
                  REMOVE REMINDER FROM THIS EVENT
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReminderButton;
