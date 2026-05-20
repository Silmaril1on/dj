"use client";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { FaLink, FaUsers } from "react-icons/fa6";
import Title from "@/app/components/ui/Title";
import ArtistCountry from "@/app/components/materials/ArtistCountry";
import FlexBox from "@/app/components/containers/FlexBox";
import Dot from "@/app/components/ui/Dot";
import Paragraph from "@/app/components/ui/Paragraph";
import MyLink from "@/app/components/ui/MyLink";
import SpanText from "@/app/components/ui/SpanText";
import { FaArrowRight } from "react-icons/fa";
import SectionContainer from "@/app/components/containers/SectionContainer";
import LikeButton from "@/app/components/buttons/artist-buttons/LikeButton";
import ReminderButton from "@/app/components/buttons/artist-buttons/ReminderButton";
import { selectUser } from "@/app/features/userSlice";
import {
  formatBirthdate,
  isOnOrAfterToday,
  isReminderEligible,
  normalizeLineup,
  truncateString,
  resolveImage,
} from "@/app/helpers/utils";

const Events = ({ events = [] }) => {
  const user = useSelector(selectUser);
  const [eventItems, setEventItems] = useState(events);
  const upcomingEvents = eventItems.filter((event) =>
    isOnOrAfterToday(event?.date),
  );

  // Initialise synchronously so SSR & first paint agree — avoids post-mount
  // layout shift that would otherwise be counted as CLS.
  const [open, setOpen] = useState(
    () => events.filter((e) => isOnOrAfterToday(e?.date))[0]?.id ?? null,
  );

  useEffect(() => {
    setEventItems(events);
  }, [events]);

  useEffect(() => {
    if (!user || events.length === 0) return;
    let cancelled = false;

    const loadStatuses = async () => {
      const ids = events.map((e) => e.id).join(",");
      const res = await fetch(`/api/events/user-states?eventIds=${ids}`);
      if (!res.ok || cancelled) return;
      const { states = {} } = await res.json();

      setEventItems((prev) =>
        prev.map((event) =>
          states[event.id]
            ? {
                ...event,
                likesCount:
                  states[event.id].likesCount ?? event.likesCount ?? 0,
                isLiked: states[event.id].isLiked ?? event.isLiked ?? false,
                isReminderSet:
                  states[event.id].isReminderSet ??
                  event.isReminderSet ??
                  false,
                reminderOffsetDays:
                  states[event.id].reminderOffsetDays ??
                  event.reminderOffsetDays ??
                  3,
              }
            : event,
        ),
      );
    };

    loadStatuses();
    return () => {
      cancelled = true;
    };
  }, [events, user]);

  // If the currently-open event leaves the list, fall back to the first one.
  useEffect(() => {
    if (open && !upcomingEvents.some((event) => event.id === open)) {
      setOpen(upcomingEvents[0]?.id ?? null);
    }
  }, [open, upcomingEvents]);

  if (upcomingEvents.length === 0) {
    return (
      <div className="w-full h-[450px] flex items-center justify-center bg-stone-900">
        <p className="text-chino text-xl">No events available</p>
      </div>
    );
  }

  return (
    <section className="w-full ">
      <SectionContainer
        title="Upcomming Events"
        description="Stay tuned for the hottest upcoming events. Don't miss out!"
      >
        <div className="flex flex-col gap-2 lg:gap-0 lg:flex-row h-fit lg:h-[550px] w-full overflow-hidden">
          {upcomingEvents.map((event, index) => {
            return (
              <Panel
                key={event.id}
                open={open}
                setOpen={setOpen}
                event={event}
                isFirst={index === 0}
                onEventUpdate={(eventId, patch) =>
                  setEventItems((prev) =>
                    prev.map((item) =>
                      item.id === eventId ? { ...item, ...patch } : item,
                    ),
                  )
                }
              />
            );
          })}
        </div>
      </SectionContainer>
    </section>
  );
};

const Panel = ({ open, setOpen, event, onEventUpdate, isFirst = false }) => {
  const isOpen = open === event.id;

  const [likesCount, setLikesCount] = useState(event.likesCount || 0);
  const [isLiked, setIsLiked] = useState(event.isLiked || false);
  const [isReminderSet, setIsReminderSet] = useState(
    event.isReminderSet || false,
  );
  const [reminderOffsetDays, setReminderOffsetDays] = useState(
    event.reminderOffsetDays || 3,
  );

  useEffect(() => {
    setLikesCount(event.likesCount || 0);
    setIsLiked(event.isLiked || false);
    setIsReminderSet(event.isReminderSet || false);
    setReminderOffsetDays(event.reminderOffsetDays || 3);
  }, [
    event.likesCount,
    event.isLiked,
    event.isReminderSet,
    event.reminderOffsetDays,
  ]);

  const handleLikeChange = (liked, newLikesCount) => {
    setIsLiked(liked);
    setLikesCount(newLikesCount);
    onEventUpdate?.(event.id, { isLiked: liked, likesCount: newLikesCount });
  };

  const lineup = normalizeLineup(event.artists);
  const canSetReminder = isReminderEligible(event.date);
  const imageUrl = resolveImage(event.image_url, "md");

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(event.id);
    }
  };

  return (
    <div
      className={`relative overflow-hidden border border-gold/30 transition-all duration-500 ease-in-out lg:mx-1
    ${
      isOpen
        ? "flex-none h-[400px] lg:flex-1 lg:h-full"
        : "flex-none h-[60px] lg:h-full lg:w-[60px] bg-stone-900 cursor-pointer hover:bg-gold/50 hover:border-gold/50"
    }`}
      onClick={!isOpen ? () => setOpen(event.id) : undefined}
      role={!isOpen ? "button" : undefined}
      tabIndex={!isOpen ? 0 : undefined}
      onKeyDown={!isOpen ? handleKeyDown : undefined}
      aria-label={!isOpen ? `Open event: ${event.event_name}` : undefined}
      aria-expanded={!isOpen ? false : undefined}
    >
      {/* Background image — single element, always present for both states */}
      {imageUrl && (
        <img
          src={imageUrl}
          alt={event.event_name}
          className="absolute inset-0 w-full h-full object-cover z-0"
          {...(isFirst
            ? { fetchPriority: "high" }
            : { loading: "lazy", fetchPriority: "low" })}
        />
      )}

      {/* Closed-state label — fades out (opacity only, no layout impact) */}
      <div
        className={`absolute inset-0 z-[2] bg-black/60 backdrop-blur-[2px] flex flex-row-reverse lg:flex-col justify-end items-center gap-4 p-2 lg:p-5 pointer-events-none transition-opacity duration-300 ${
          isOpen ? "opacity-0" : "opacity-100"
        }`}
      >
        <span
          style={{ writingMode: "vertical-lr" }}
          className="hidden lg:block text-2xl font-bold text-chino rotate-180 uppercase"
        >
          {truncateString(event.event_name, 40)}
        </span>
        <span className="block lg:hidden text-lg font-medium text-chino truncate w-full">
          {event.event_name}
        </span>
      </div>

      {/* Open-state content — fades in (opacity only, no layout impact) */}
      <motion.div
        variants={descriptionVariants}
        initial="closed"
        animate={isOpen ? "open" : "closed"}
        className="absolute inset-0 z-[3] flex flex-col justify-between items-start bg-gradient-to-r from-black via-black/80 to-black/0 p-2 lg:p-4 overflow-y-auto"
      >
        <div className="lg:space-y-1 flex flex-col">
          <MyLink
            href={event.links}
            target="_blank"
            text="Check Event"
            ariaLabel={`Check event on external website: ${event.event_name}`}
            icon={<FaLink />}
          />
          <MyLink
            href={`events/${event.event_slug || event.id}`}
            ariaLabel={`View details for ${event.event_name}`}
            text="View Details"
            icon={<FaArrowRight />}
          />
        </div>
        <div>
          <div className="absolute flex justify-end gap-2 py-1.5 bg-black/50 shadow-lg rounded-md backdrop-blur-lg top-2 lg:top-4 right-2 lg:right-4 w-32 px-2">
            <SpanText
              icon={<FaUsers />}
              as="span"
              size="xs"
              text={`${likesCount} Interested`}
              className="secondary pointer-events-none"
            />
            <LikeButton
              size={14}
              type="event"
              artist={{ id: event.id, isLiked, likesCount }}
              onLikeChange={handleLikeChange}
            />
          </div>
          {canSetReminder && (
            <div className="flex justify-end gap-2 py-1.5 absolute top-2 lg:top-17 right-2 lg:right-4 bg-black/50 shadow-lg rounded-md backdrop-blur-lg w-32 px-2">
              <SpanText
                text="Set Reminder"
                size="xs"
                className="secondary pointer-events-none"
              />
              <ReminderButton
                size={16}
                event={{ id: event.id, isReminderSet, reminderOffsetDays }}
                onReminderChange={(nextState, nextOffset) => {
                  const resolvedOffset = nextOffset ?? reminderOffsetDays ?? 3;
                  setIsReminderSet(nextState);
                  if (nextOffset) setReminderOffsetDays(nextOffset);
                  onEventUpdate?.(event.id, {
                    isReminderSet: nextState,
                    reminderOffsetDays: resolvedOffset,
                  });
                }}
              />
            </div>
          )}
          <Title
            className="uppercase text-start leading-4"
            text={event.event_name}
          />
          <FlexBox type="column-start" className="my-2 lg:my-4">
            <ArtistCountry
              artistCountry={{ country: event.country, city: event.city }}
            />
            <Paragraph text={event.address} />
          </FlexBox>
          <FlexBox type="row-start" className="gap-2">
            <p className="text-chino text-[10px] lg:text-base">
              Doors Open: {event.doors_open}
            </p>
            <Dot />
            <p className="text-gold text-[10px] lg:text-base uppercase">
              {formatBirthdate(event.date)}
            </p>
          </FlexBox>
          {lineup.length > 0 && (
            <>
              <Title
                color="cream"
                size="xs"
                className="uppercase font-medium"
                text="Lineup"
              />
              <FlexBox type="row-start" className="flex-wrap items-center pt-1">
                {lineup.slice(0, 10).map((artist, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-0.5 lg:space-x-2"
                  >
                    <Title
                      color="cream"
                      className="uppercase text-sm lg:text-4xl leading-7"
                      text={artist}
                    />
                    {index < lineup.length - 1 && <Dot />}
                  </div>
                ))}
              </FlexBox>
            </>
          )}
          {event?.description && (
            <div className="w-[80%] mt-2">
              <Paragraph text={truncateString(event?.description, 300)} />
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Events;

// Only opacity is animated — no layout-affecting properties, zero CLS.
const descriptionVariants = {
  open: {
    opacity: 1,
    transition: {
      delay: 0.125,
    },
  },
  closed: { opacity: 0 },
};
