"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import SectionContainer from "@/app/components/containers/SectionContainer";
import Motion from "@/app/components/containers/Motion";
import ShareButton from "@/app/components/buttons/ShareButton";
import ReminderButton from "@/app/components/buttons/artist-buttons/ReminderButton";
import { capitalizeFirst, formatBirthdate } from "@/app/helpers/utils";
import { FaUsers, FaCalendarAlt } from "react-icons/fa";

// ── Large featured card (left column) ────────────────────────────────────────
const FeaturedCard = ({ event }) => {
  const artistList = Array.isArray(event.artists) ? event.artists : [];

  return (
    <motion.div
      initial={{ x: "100%", scale: 0.5 }}
      animate={{
        x: 0,
        scale: 1,
        transition: { duration: 1, delay: 0.2, ease: [0.32, 0.72, 0, 1] },
      }}
      exit={{
        x: "-100%",
        scale: 0.5,
        transition: { duration: 1.5, ease: [0.32, 0.72, 0, 1] },
      }}
      className="absolute inset-0"
    >
      <div className="relative w-full h-full">
        {/* action buttons — outside Link so clicks don't navigate */}
        <div className="absolute w-full justify-between top-3 items-center px-2 flex z-10">
          <ShareButton
            url={`/events/${event.id}`}
            artistName={event.event_name || "this event"}
          />
          <ReminderButton size={20} event={event} />
        </div>
        <Link href={`/events/${event.id}`} className="group block h-full">
          <div className="relative w-full h-full overflow-hidden bg-stone-900 border border-gold/20">
            {event.event_image ? (
              <Image
                src={event.event_image}
                alt={event.event_name || "Event"}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full bg-stone-800" />
            )}

            {/* gradient overlay */}
            <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/30 to-transparent" />

            {/* info */}
            <div className="absolute bottom-0 left-0 w-full p-4">
              {event.likesCount > 0 && (
                <p className="text-gold text-[10px] leading-none secondary flex items-center gap-1 my-1">
                  <FaUsers size={15} />
                  {event.likesCount} interested
                </p>
              )}
              <p className="text-gold font-bold text-4xl leading-7">
                {event.venue_name}
              </p>
              <p className="text-cream font-normal secondary text-xs leading-none line-clamp-2 mb-1">
                {capitalizeFirst(event.event_name || "TBA")}
              </p>

              {event.date && (
                <p className="text-gold text-sm font-bold flex items-center gap-1">
                  <FaCalendarAlt size={13} />
                  <span className="pt-0.5">{formatBirthdate(event.date)}</span>
                </p>
              )}

              {event.city && (
                <p className="text-cream/60 text-xs leading-none mt-0.5">
                  {event.city}
                  {event.country ? `, ${event.country}` : ""}
                </p>
              )}

              {artistList.length > 0 && (
                <p className="text-cream/80 uppercase text-sm leading-none mt-0.5">
                  {artistList.slice(0, 5).join(", ")}
                  <span className="font-light text-gold">
                    {" "}
                    {artistList.length > 5 && "And More"}
                  </span>
                </p>
              )}
            </div>
          </div>
        </Link>
      </div>
    </motion.div>
  );
};

// ── Small thumbnail card (right 3×3 grid) ────────────────────────────────────
const ThumbCard = ({ event, active, onClick, delay }) => (
  <Motion animation="fade" delay={delay}>
    <button
      onClick={onClick}
      className={`group relative w-full aspect-square cursor-pointer overflow-hidden duration-300 ${
        active ? " brightness-100" : "opacity-60 hover:opacity-100"
      }`}
    >
      {event.event_image ? (
        <Image
          src={event.event_image}
          alt={event.event_name || "Event"}
          fill
          sizes="(max-width: 1024px) 33vw, 17vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
      ) : (
        <div className="w-full h-full bg-stone-800" />
      )}

      <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent" />

      <div className="absolute bottom-0 left-0 w-full p-1.5 space-y-0.5">
        <p className="text-cream text-sm font-semibold leading-tight line-clamp-2 text-end min-h-auto ">
          {event.venue_name}
        </p>
        {event.date && (
          <p className="text-gold text-[9px] font-bold leading-none text-end">
            {formatBirthdate(event.date)}
          </p>
        )}
      </div>
    </button>
  </Motion>
);

// ── Main component ────────────────────────────────────────────────────────────
const NearYou = () => {
  const [events, setEvents] = useState([]);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [usedCity, setUsedCity] = useState(false);

  useEffect(() => {
    const readLocation = () => {
      try {
        const stored = localStorage.getItem("userLocation");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.country)
            setLocation({ country: parsed.country, city: parsed.city || null });
        }
      } catch {
        // localStorage unavailable
      }
      setLoading(false);
    };

    readLocation();

    // Re-read when UserRegion writes location in this tab after component already mounted
    window.addEventListener("userLocationSet", readLocation);
    return () => window.removeEventListener("userLocationSet", readLocation);
  }, []);

  useEffect(() => {
    if (!location?.country) return;

    const fetchEvents = async () => {
      setLoading(true);
      const params = new URLSearchParams({ country: location.country });
      if (location.city) params.set("city", location.city);
      const res = await fetch(`/api/events/near-you-events?${params}`);
      const json = await res.json();
      if (json.success && json.data?.length > 0) {
        const mapped = json.data.map((event, i) => ({ ...event, _key: i }));
        setEvents(mapped);
        setUsedCity(mapped[0]?._cityMatch ?? false);
        setActiveIndex(0);
      }
      setLoading(false);
    };

    fetchEvents();
  }, [location]);

  if (!loading && !location?.country) return null;

  if (loading) {
    return (
      <div className="w-full pt-3 px-2 lg:px-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-stone-900 border border-gold/10 animate-pulse aspect-square" />
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="bg-stone-900 border border-gold/10 animate-pulse aspect-square"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (events.length === 0) return null;

  const activeEvent = events[activeIndex];
  const thumbEvents = events.slice(1);

  return (
    <SectionContainer
      title={`Don't Miss ${usedCity && location?.city ? location.city : location?.country || ""} Events`}
      description="Upcoming events near you. Get reminders  and discover who's playing around"
    >
      <div className="grid lg:grid-cols-2 gap-3  lg:px-[15%] pb-3 w-full ">
        {/* Left — featured */}
        <div className="relative h-full min-h-[400px] overflow-hidden">
          <AnimatePresence mode="sync" initial={false}>
            <FeaturedCard key={activeEvent._key} event={activeEvent} />
          </AnimatePresence>
        </div>

        {/* Right — 3×3 thumbnails */}
        <div className="grid grid-cols-3 gap-x-3 ">
          {thumbEvents.map((event, i) => (
            <ThumbCard
              key={event._key}
              event={event}
              active={event._key === activeEvent._key}
              onClick={() => setActiveIndex(i + 1)}
              delay={0.1 + i * 0.05}
            />
          ))}
        </div>
      </div>
    </SectionContainer>
  );
};

export default NearYou;
