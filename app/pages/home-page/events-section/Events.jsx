"use client";
import { AnimatePresence, motion } from "framer-motion";
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
  const [open, setOpen] = useState(null);
  const [eventItems, setEventItems] = useState(events);
  const upcomingEvents = eventItems.filter((event) =>
    isOnOrAfterToday(event?.date),
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

  useEffect(() => {
    if (upcomingEvents.length > 0 && open === null) {
      setOpen(upcomingEvents[0].id);
    }
  }, [upcomingEvents, open]);

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
    <section className="w-full h-screen">
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
  const { width } = useWindowSize();
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
    onEventUpdate?.(event.id, {
      isLiked: liked,
      likesCount: newLikesCount,
    });
  };

  const lineup = normalizeLineup(event.artists);
  const canSetReminder = isReminderEligible(event.date);

  return (
    <>
      {!isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-stone-900 lg:mx-1 hover:bg-gold/50 cursor-pointer border border-gold/30 hover:border-gold/50 duration-300 flex flex-row-reverse lg:flex-col justify-end items-center gap-4 relative group "
          onClick={() => setOpen(event.id)}
        >
          {resolveImage(event.image_url, "md") && (
            <img
              loading="lazy"
              src={resolveImage(event.image_url, "md")}
              alt={event.event_name}
              className="absolute inset-0 w-full h-full object-cover z-0"
              fetchpriority="low"
            />
          )}
          <div className="bg-black/60 relative z-[2] w-full h-full p-2 lg:p-5 backdrop-blur-xs flex justify-start">
            <span
              style={{
                writingMode: "vertical-lr",
              }}
              className="hidden lg:block text-2xl font-bold duration-300 text-chino rotate-180 uppercase "
            >
              {truncateString(event.event_name, 40)}
            </span>
            <span className="block lg:hidden text-lg font-medium text-chino truncate w-full">
              {event.event_name}
            </span>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key={`panel-${event.id}`}
            variants={width && width > 1024 ? panelVariants : panelVariantsSm}
            initial="closed"
            animate="open"
            exit="closed"
            className="w-full h-full overflow-hidden relative flex items-end lg:mx-1 border border-gold/30"
          >
            {resolveImage(event.image_url, "md") && (
              <img
                {...(isFirst
                  ? { fetchPriority: "high" }
                  : { loading: "lazy", fetchPriority: "low" })}
                src={resolveImage(event.image_url, "md")}
                alt={event.event_name}
                className="absolute right-0 h-full w-auto object-cover"
              />
            )}
            <motion.div
              variants={descriptionVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="relative w-full h-full flex flex-col justify-between items-start bg-gradient-to-r from-black via-black/80 to-black/0 p-2 lg:p-4"
            >
              <div className="lg:space-y-1">
                <MyLink
                  href={event.links}
                  target="_blank"
                  text="Check Event"
                  icon={<FaLink />}
                />
                <MyLink
                  href={`events/${event.id}`}
                  text="View Details"
                  icon={<FaArrowRight />}
                />
              </div>
              <div>
                <div className="absolute flex justify-end gap-2 py-1.5 bg-black/50 shadow-lg rounded-md backdrop-blur-lg  top-2 lg:top-4 right-2 lg:right-4 w-32 px-2">
                  <SpanText
                    icon={<FaUsers />}
                    size="xs"
                    text={`${likesCount} Interested`}
                    className="secondary pointer-events-none"
                  />
                  <LikeButton
                    size={14}
                    type="event"
                    artist={{
                      id: event.id,
                      isLiked: isLiked,
                      likesCount: likesCount,
                    }}
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
                      event={{
                        id: event.id,
                        isReminderSet,
                        reminderOffsetDays,
                      }}
                      onReminderChange={(nextState, nextOffset) => {
                        const resolvedOffset =
                          nextOffset ?? reminderOffsetDays ?? 3;
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
                    <FlexBox
                      type="row-start"
                      className="flex-wrap items-center pt-1"
                    >
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
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Events;

const panelVariants = {
  open: {
    width: "100%",
    height: "100%",
  },
  closed: {
    width: "0%",
    height: "100%",
  },
};

const panelVariantsSm = {
  open: {
    width: "100%",
    height: "400px",
  },
  closed: {
    width: "100%",
    height: "0px",
  },
};

const descriptionVariants = {
  open: {
    opacity: 1,
    transition: {
      delay: 0.125,
    },
  },
  closed: { opacity: 0 },
};

const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: undefined,
    height: undefined,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener("resize", handleResize);

    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowSize;
};
