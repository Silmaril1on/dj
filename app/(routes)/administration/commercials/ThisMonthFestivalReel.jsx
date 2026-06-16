"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { createRoot } from "react-dom/client";
import { motion, AnimatePresence } from "framer-motion";
import ArtistCountry from "@/app/components/materials/ArtistCountry";
import { playSound } from "@/app/helpers/playSound";
import { soundManager } from "@/app/helpers/soundManager";
import Twinkles from "../branding/components/Twinkles";

const GlobeGL = dynamic(
  () => import("react-globe.gl").then((m) => m.default ?? m),
  { ssr: false },
);

const INTRO_DURATION = 5000;
const FESTIVAL_DURATION = 2600;
const GLOBE_IMG_URL = "/globe/earth-night.jpg";
const GLOBE_BUMP_URL = "/globe/earth-topology.png";

const getFestivalKey = (festival) =>
  `${festival.id}-${festival.edition_id || "no-edition"}`;

const formatDateRange = (start, end) => {
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : startDate;
  if (Number.isNaN(startDate.getTime())) return "TBA";

  const month = startDate.toLocaleString("en-US", { month: "short" });
  const startDay = startDate.getDate();
  const endDay = endDate.getDate();

  return `${month} ${startDay}${endDay !== startDay ? `-${endDay}` : ""}`;
};

const FestivalPin = ({ festival }) => {
  const imageUrl =
    festival.image_url || festival.image || "/assets/elivagar-logo.png";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: [0, 1.16, 1] }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className="flex flex-col items-center gap-0.5"
    >
      <div className="h-10 w-10 overflow-hidden rounded-full">
        <img
          src={imageUrl}
          alt={festival.name}
          loading="lazy"
          className="block h-full w-full object-cover"
        />
      </div>
      <span className="whitespace-nowrap rounded-sm bg-black/60 px-1 py-px text-xs font-bold uppercase leading-[1.4] tracking-[0.04em] text-cream">
        {festival.name}
      </span>
    </motion.div>
  );
};

const FestivalInfoCard = ({ festival, index }) => {
  const imageUrl =
    festival.image_url || festival.image || "/assets/elivagar-logo.png";

  return (
    <motion.div
      key={getFestivalKey(festival)}
      initial={{ opacity: 0, y: 35, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -25, scale: 0.95 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="absolute bottom-16 left-1/2 z-30 w-[82%] -translate-x-1/2 border border-gold/50 bg-black/80 p-4  backdrop-blur-md"
    >
      <div className="flex items-center gap-4">
        <motion.div
          initial={{ rotate: -20, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 170 }}
          className="h-16 w-16 overflow-hidden border-2 border-gold bg-black"
        >
          <img
            src={imageUrl}
            alt={festival.name}
            className="h-full w-full object-cover"
          />
        </motion.div>

        <div className="min-w-0 flex-1">
          <motion.p
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="text-[10px] font-bold uppercase tracking-[0.35em] text-gold/70"
          >
            Festival #{index + 1}
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="truncate text-3xl font-black uppercase text-gold"
          >
            {festival.name}
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 }}
            className="text-sm font-bold uppercase text-white"
          >
            <ArtistCountry
              color="text-cream"
              className="font-medium"
              artistCountry={{ country: festival.country, city: festival.city }}
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.45 }}
            className="mt-1 text-lg font-black uppercase text-gold"
          >
            {formatDateRange(festival.start_date, festival.end_date)}
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
};

const ThisMonthFestivalReel = ({ festivals = [], monthLabel = "" }) => {
  const globeRef = useRef(null);
  const [twinkle, setTwinkle] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const [showGlobe, setShowGlobe] = useState(false);
  const [showOutro, setShowOutro] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setTwinkle(true);
    }, 1200);
  });

  const reelFestivals = useMemo(
    () => (Array.isArray(festivals) ? festivals : []),
    [festivals],
  );

  const activeFestival = reelFestivals[activeIndex];
  const activeFestivalKey = activeFestival
    ? getFestivalKey(activeFestival)
    : "";

  const activeGlobeData = useMemo(() => {
    if (activeFestival?.lat == null || activeFestival?.lng == null) return [];
    return [activeFestival];
  }, [activeFestival]);

  useEffect(() => {
    setActiveIndex(0);
    setShowIntro(true);
    setShowGlobe(false);
    setShowOutro(false);

    if (!reelFestivals.length) return undefined;

    playSound("monthIntro");

    const introTimer = setTimeout(() => setShowIntro(false), INTRO_DURATION);
    const globeTimer = setTimeout(
      () => setShowGlobe(true),
      INTRO_DURATION - 500,
    );

    let sequenceTimer;
    const sequenceStartTimer = setTimeout(() => {
      sequenceTimer = setInterval(() => {
        setActiveIndex((prev) => {
          const next = prev + 1;

          if (next >= reelFestivals.length) {
            clearInterval(sequenceTimer);
            setTimeout(() => setShowOutro(true), 1200);
            return prev;
          }

          return next;
        });
      }, FESTIVAL_DURATION);
    }, INTRO_DURATION);

    const outroTimer = setTimeout(
      () => {
        if (sequenceTimer) clearInterval(sequenceTimer);
        setShowOutro(true);
      },
      INTRO_DURATION + reelFestivals.length * FESTIVAL_DURATION + 1400,
    );

    return () => {
      clearTimeout(introTimer);
      clearTimeout(globeTimer);
      clearTimeout(sequenceStartTimer);
      clearTimeout(outroTimer);
      if (sequenceTimer) clearInterval(sequenceTimer);
      soundManager.stopMany(["monthIntro", "monthlyListing", "weekIntro"]);
    };
  }, [reelFestivals]);

  useEffect(() => {
    if (showIntro || showOutro || !activeFestivalKey) return undefined;

    playSound("monthlyListing");

    return () => {
      soundManager.stop("monthlyListing");
    };
  }, [activeFestivalKey, showIntro, showOutro]);

  useEffect(() => {
    if (!showOutro) return undefined;

    playSound("weekIntro");

    return () => {
      soundManager.stop("weekIntro");
    };
  }, [showOutro]);

  useEffect(() => {
    if (
      !globeRef.current ||
      !activeFestival ||
      activeFestival.lat == null ||
      activeFestival.lng == null
    ) {
      return;
    }

    globeRef.current.pointOfView(
      {
        lat: Number(activeFestival.lat),
        lng: Number(activeFestival.lng),
        altitude: 1.65,
      },
      1400,
    );
  }, [activeFestival]);

  const handleGlobeReady = () => {
    const controls = globeRef.current?.controls?.();
    if (controls) {
      controls.autoRotate = false;
      controls.enableZoom = false;
      controls.enablePan = false;
    }

    if (
      activeFestival &&
      activeFestival.lat != null &&
      activeFestival.lng != null
    ) {
      globeRef.current?.pointOfView(
        {
          lat: Number(activeFestival.lat),
          lng: Number(activeFestival.lng),
          altitude: 1.65,
        },
        900,
      );
    }
  };

  return (
    <div className="relative h-[800px] w-full lg:aspect-[9/16] overflow-hidden bg-black text-white">
      {/* background gradients */}
      {/* <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,190,0,0.22),transparent_25%),radial-gradient(circle_at_bottom,rgba(255,190,0,0.12),transparent_35%)]" /> */}

      {!reelFestivals.length && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black px-8 text-center">
          <p className="secondary text-xs uppercase tracking-[0.35em] text-chino">
            No festivals found for this reel.
          </p>
        </div>
      )}

      {twinkle && (
        <Twinkles id="month-reel-twinkles" className="absolute inset-0 z-0" />
      )}

      {/* intro section */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.08 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black"
          >
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs  secondary uppercase tracking-[0.45em] text-cream/80"
            >
              Soundfolio Presents
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ delay: 0.35, duration: 0.6 }}
              className="mt-4 text-center text-5xl font-black uppercase leading-none text-gold"
            >
              This Month&apos;s
              <br />
              Festivals
            </motion.h1>

            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 220 }}
              transition={{ delay: 1, duration: 0.55 }}
              className="mt-6 h-[2px] bg-gold"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* header section */}
      <motion.div
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: showGlobe ? 1 : 0, y: showGlobe ? 0 : -24 }}
        transition={{ duration: 0.55 }}
        className="absolute left-0 right-0 top-8 z-20 text-center"
      >
        <p className="text-[10px] secondary uppercase tracking-[0.45em] text-chino">
          Soundfolio Radar
        </p>
        <h2 className="mt-2 text-3xl font-black uppercase text-gold">
          {monthLabel}
        </h2>
      </motion.div>

      {/* globe section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.72, y: 80 }}
        animate={{
          opacity: showGlobe ? 1 : 0,
          scale: showGlobe ? 1 : 0.72,
          y: showGlobe ? 0 : 80,
        }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="absolute left-1/2 top-[115px] z-10 h-[440px] w-[440px] -translate-x-1/2"
      >
        {/* <div className="month-glow-ring" /> */}
        <div className="relative z-10 h-full w-full">
          <GlobeGL
            ref={globeRef}
            width={440}
            height={440}
            backgroundColor="rgba(0,0,0,0)"
            globeImageUrl={GLOBE_IMG_URL}
            bumpImageUrl={GLOBE_BUMP_URL}
            onGlobeReady={handleGlobeReady}
            htmlElementsData={activeGlobeData}
            htmlLat={(d) => Number(d.lat)}
            htmlLng={(d) => Number(d.lng)}
            htmlElement={(festival) => {
              const el = document.createElement("div");
              el.style.cssText =
                "pointer-events:none;transform:translate(-50%,-100%);";
              createRoot(el).render(<FestivalPin festival={festival} />);
              return el;
            }}
            htmlAltitude={0.01}
            htmlTransitionDuration={300}
          />
        </div>
      </motion.div>

      {/* active festival data section */}
      <AnimatePresence mode="wait">
        {!showIntro && !showOutro && activeFestival && (
          <FestivalInfoCard
            key={getFestivalKey(activeFestival)}
            festival={activeFestival}
            index={activeIndex}
          />
        )}
      </AnimatePresence>

      {/* progress section */}
      <div className="absolute bottom-8 left-1/2 z-40 flex -translate-x-1/2 gap-2">
        {reelFestivals.map((festival, index) => (
          <div
            key={getFestivalKey(festival)}
            className={`h-1.5 transition-all duration-500 ${
              index === activeIndex ? "w-8 bg-gold" : "w-2 bg-gold/30"
            }`}
          />
        ))}
      </div>

      {/* outro section */}
      <AnimatePresence>
        {showOutro && (
          <motion.div
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 px-8 text-center backdrop-blur-md"
          >
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs secondary uppercase tracking-[0.45em] text-cream/70"
            >
              Explore More
            </motion.p>

            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mt-4 text-5xl font-black uppercase leading-none text-gold"
            >
              Discover more
              <br />
              Festivals
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-5 text-sm secondary uppercase tracking-widest text-chino"
            >
              on Soundfolio
            </motion.p>
            <motion.p
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: 0.5,
                duration: 0.5,
                type: "spring",
                stiffness: 160,
              }}
            >
              <img
                src="/assets/elivagar-logo.png"
                alt="Soundfolio"
                className="h-30 w-30 sepia mt-5"
              />
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThisMonthFestivalReel;
