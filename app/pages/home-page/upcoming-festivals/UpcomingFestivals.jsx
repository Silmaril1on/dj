"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  AnimatePresence,
} from "framer-motion";
import ArtistCountry from "@/app/components/materials/ArtistCountry";
import { formatBirthdate } from "@/app/helpers/utils";
import MyLink from "@/app/components/ui/MyLink";

const ScrollCounter = ({ scrollYProgress, total }) => {
  const rawIndex = useTransform(scrollYProgress, [0, 1], [1, total]);
  const springIndex = useSpring(rawIndex, {
    stiffness: 120,
    damping: 26,
    mass: 0.6,
  });

  const [currentIndex, setCurrentIndex] = useState(1);

  useEffect(() => {
    return springIndex.on("change", (v) => {
      const next = Math.round(Math.min(Math.max(v, 1), total));
      setCurrentIndex(next);
    });
  }, [springIndex, total]);

  return (
    <div className="pointer-events-none absolute inset-0 z-50">
      <div className="hidden md:flex sticky top-0 h-screen flex-col items-center justify-center select-none">
        <div className="w-px h-32 bg-gradient-to-t from-gold/80 to-transparent mb-6" />
        <AnimatePresence mode="popLayout">
          <motion.span
            key={currentIndex}
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -16, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="font-bold text-gold text-5xl md:text-7xl leading-none tabular-nums"
          >
            {currentIndex}
          </motion.span>
        </AnimatePresence>

        <span className="text-cream/80 text-lg uppercase tracking-widest mt-1">
          / {total}
        </span>
        <div className="w-px h-32 bg-gradient-to-b from-gold/80 to-transparent mt-6" />
      </div>
    </div>
  );
};

const FestivalCard = ({ festival, index, total, sectionProgress }) => {
  const maxStep = Math.max(total - 1, 1);
  const scaleStart = (index + 0.45) / maxStep;
  const scaleEnd = (index + 1) / maxStep;
  const shouldScale = index < total - 1;

  const scale = useTransform(
    sectionProgress,
    shouldScale ? [scaleStart, scaleEnd] : [0, 1],
    shouldScale ? [1, 0.72] : [1, 1],
  );

  const opacity = useTransform(
    sectionProgress,
    shouldScale ? [scaleStart, scaleEnd] : [0, 1],
    shouldScale ? [1, 0.65] : [1, 1],
  );

  const y = useTransform(
    sectionProgress,
    shouldScale ? [scaleStart, scaleEnd] : [0, 1],
    shouldScale ? [0, -40] : [0, 0],
  );

  return (
    <div
      className="sticky top-0 h-screen flex items-center justify-center overflow-hidden"
      style={{ zIndex: index + 1 }}
    >
      <motion.div
        style={{
          scale,
          opacity,
          y,
          transformOrigin: "center center",
        }}
        className="w-full max-w-6xl mx-auto px-4 md:px-8 h-full flex items-center bg-black"
      >
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-20 items-center relative ">
          <div className="flex flex-col gap-4 py-5 pl-5">
            <div className="flex flex-col items-center lg:items-start gap-1">
              <MyLink
                href={`/festivals/${festival.festival_slug}`}
                text="View Details"
              />
              <Link
                href={`/festivals/${festival.festival_slug}`}
                className="group"
              >
                <h2 className="text-cream text-3xl mt-3 leading-6 md:text-5xl font-bold uppercase group-hover:text-gold transition-colors duration-300">
                  {festival.name}
                </h2>
              </Link>
              <ArtistCountry artistCountry={festival} />
            </div>

            <div className="flex flex-col items-center lg:items-start gap-1">
              <p className="secondary text-xs text-chino mb-1">
                Date & Location
              </p>
              <span className="text-gold text-lg leading-4 font-bold uppercase">
                {formatBirthdate(festival.start_date)}
                {festival.end_date && festival.end_date !== festival.start_date
                  ? ` - ${formatBirthdate(festival.end_date)}`
                  : ""}
              </span>

              {festival.address && (
                <span className="text-chino leading-2 text-sm secondary">
                  {festival.address}
                </span>
              )}
              {festival.capacity_total && (
                <span className="text-chino/90 secondary mt-2">
                  Attendees over{" "}
                  <b className="text-cream">
                    {Number(festival.capacity_total).toLocaleString()}
                  </b>{" "}
                  people
                </span>
              )}
            </div>

            <div className="flex flex-col items-center lg:items-start text-xs text-chino/60">
              <div className="flex items-center space-x-2">
                {(festival.festival_genre || []).slice(0, 3).map((g, i) => (
                  <span
                    key={i}
                    className="border border-gold/40 bg-gold/10 px-2 py-1 text-gold secondary capitalize"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>

            {(festival.artists || []).length > 0 && (
              <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                {festival.artists.map((name, i) => (
                  <span
                    key={i}
                    className="text-[11px] text-cream/90 uppercase font-bold leading-none"
                  >
                    {name}
                    {i < festival.artists.length - 1 ? " ·" : ""}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end">
            {festival.festival_poster ? (
              <div>
                <img
                  loading="lazy"
                  src={festival.festival_poster}
                  alt={festival.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-48 md:w-64 aspect-[2/3] border border-gold/10 bg-stone-900/40 flex items-center justify-center">
                <span className="text-chino/30 text-xs uppercase tracking-widest text-center px-4">
                  {festival.name}
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const UpcomingFestivals = () => {
  const [festivals, setFestivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
    layoutEffect: false,
  });

  useEffect(() => {
    let alive = true;

    async function loadFestivals() {
      try {
        const res = await fetch("/api/festivals/upcoming");
        const json = await res.json();

        if (!alive) return;

        setFestivals(json.festivals || []);
      } catch {
        if (!alive) return;
        setFestivals([]);
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadFestivals();

    return () => {
      alive = false;
    };
  }, []);

  if (loading || festivals.length === 0) {
    return (
      <section className="relative bg-black">
        <div ref={containerRef} className="min-h-screen" />
      </section>
    );
  }

  return (
    <section className="relative bg-black w-full">
      <div
        ref={containerRef}
        className="relative "
        style={{ minHeight: `${festivals.length * 100}vh` }}
      >
        <div className="sticky z-40 top-0 px-4 py-10 text-center pointer-events-none">
          <h2 className="text-cream text-lg uppercase tracking-[0.3em]">
            Upcoming Festivals
          </h2>
        </div>

        <ScrollCounter
          scrollYProgress={scrollYProgress}
          total={festivals.length}
        />

        {festivals.map((festival, index) => (
          <FestivalCard
            key={festival.id}
            festival={festival}
            index={index}
            total={festivals.length}
            sectionProgress={scrollYProgress}
          />
        ))}
      </div>
    </section>
  );
};

export default UpcomingFestivals;
