"use client";
import { useState, useEffect } from "react";
import GlobalModal from "./GlobalModal";
import Button from "@/app/components/buttons/Button";
import { formatBirthdate } from "@/app/helpers/utils";
import Spinner from "../ui/Spinner";
import ArtistCountry from "../materials/ArtistCountry";
import SliderContainer from "../containers/SliderContainer";
import ProfilePicture from "../materials/ProfilePicture";

const ScheduleModal = ({ isOpen, onClose }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [processingAction, setProcessingAction] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchPending();
    }
  }, [isOpen]);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/artists/schedule/pending");
      const data = await res.json();
      setSchedules(data.schedules || []);
      setActiveIndex(0);
    } catch {
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = (id) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  };

  const handleApprove = async (id) => {
    if (!id) return;

    setProcessingAction("approve");
    try {
      await fetch("/api/artists/schedule/pending", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      removeItem(id);
    } finally {
      setProcessingAction(null);
    }
  };

  const handleDecline = async (id) => {
    if (!id) return;

    setProcessingAction("decline");
    try {
      await fetch(`/api/artists/schedule/pending?id=${id}`, {
        method: "DELETE",
      });
      removeItem(id);
    } finally {
      setProcessingAction(null);
    }
  };

  const current = schedules[activeIndex];
  const total = schedules.length;

  return (
    <GlobalModal
      isOpen={isOpen}
      onClose={onClose}
      title="Pending Schedules"
      maxWidth="max-w-lg"
    >
      {loading ? (
        <Spinner />
      ) : total === 0 ? (
        <div className="py-10 text-center text-cream">
          No pending schedule approvals.
        </div>
      ) : (
        <div className="space-y-4 ">
          <div className="flex justify-between items-center">
            <p className="text-cream secondary font-medium text-sm">
              {total} pending schedule{total !== 1 ? "s" : ""} to review
            </p>
            <div className="text-xs secondary text-gold text-right">
              {activeIndex + 1} / {total}
            </div>
          </div>
          {/* Slides */}
          <SliderContainer
            key={total}
            items={schedules}
            itemsPerPage={1}
            cardWidth={470}
            cardMargin={0}
            onIndexChange={setActiveIndex}
            className="w-full"
            buttonDown={true}
          >
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                style={{ width: "470px", flexShrink: 0 }}
                className=" flex flex-col bg-stone-900 p-4 space-y-3"
              >
                {/* Creator info */}
                <div className="flex items-center gap-2">
                  <ProfilePicture
                    avatar_url={schedule.creator.user_avatar}
                    type="icon"
                  />
                  <div className="flex flex-col leading-none">
                    <span className="text-[10px] secondary">
                      Event Submitted by
                    </span>
                    <span className="text-cream">
                      {schedule.creator.userName || "Unknown"}
                    </span>
                  </div>
                </div>
                <h3 className="text-gold font-bold text-2xl leading-none capitalize">
                  {schedule.event_title || "Untitled Event"}
                </h3>
                <div className="*:leading-none">
                  {schedule.club_name && (
                    <p className="text-cream font-bold text-sm secondary">
                      {schedule.club_name}
                    </p>
                  )}
                  <ArtistCountry
                    artistCountry={{
                      country: schedule.country,
                      city: schedule.city,
                    }}
                  />
                </div>

                <div className="leading-none">
                  <h1 className="secondary text-[10px] text-chino">
                    Date & Time
                  </h1>
                  <p className="text-cream/80 font-bold">
                    {formatBirthdate(schedule.date)}
                    {schedule.time ? ` · ${schedule.time}` : ""}
                  </p>
                </div>

                {/* Links */}
                <div className="flex gap-4 grow items-end *:duration-300 *:text-cream *:hover:text-gold secondary text-xs underline">
                  {schedule.event_link && (
                    <a
                      href={schedule.event_link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      External Link
                    </a>
                  )}
                  {schedule.event_slug && (
                    <a
                      href={`/events/${schedule.event_slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Event
                    </a>
                  )}
                </div>
              </div>
            ))}
          </SliderContainer>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              type="error"
              text="Decline"
              size="small"
              onClick={() => handleDecline(current?.id)}
              loading={processingAction === "decline"}
              disabled={processingAction !== null}
            />

            <Button
              type="success"
              text="Approve"
              size="small"
              onClick={() => handleApprove(current?.id)}
              loading={processingAction === "approve"}
              disabled={processingAction !== null}
            />
          </div>
        </div>
      )}
    </GlobalModal>
  );
};

export default ScheduleModal;
