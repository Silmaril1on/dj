"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import ArtistCountry from "@/app/components/materials/ArtistCountry";
import { playSound } from "@/app/helpers/playSound";
import { soundManager } from "@/app/helpers/soundManager";

const demoFestival = {
  name: "Tomorrowland",
  country: "Belgium",
  city: "Boom",
  start_date: "2026-07-17",
  end_date: "2026-07-26",
  genre: "Electronic Music",
  artists: [
    "Anyma",
    "Charlotte de Witte",
    "Amelie Lens",
    "Tale Of Us",
    "Kevin de Vries",
    "Armin van Buuren",
    "MRAK",
    "ARTBAT",
  ],
};

const formatDateRange = (start, end) => {
  if (!start) return "TBA";

  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;
  if (Number.isNaN(startDate.getTime())) return "TBA";

  const startMonth = startDate.toLocaleString("en-US", { month: "short" });
  const startDay = startDate.getDate();
  const endDay =
    endDate && !Number.isNaN(endDate.getTime()) ? endDate.getDate() : null;
  const endMonth =
    endDate && !Number.isNaN(endDate.getTime())
      ? endDate.toLocaleString("en-US", { month: "short" })
      : startMonth;

  if (!endDay || endDay === startDay) return `${startMonth} ${startDay}`;
  if (endMonth !== startMonth) {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
  }

  return `${startMonth} ${startDay} - ${endDay}`;
};

const fillLineup = (lineup = []) => {
  const artists = Array.isArray(lineup)
    ? lineup
        .map((artist) => String(artist).trim())
        .filter(Boolean)
        .slice(0, 8)
    : [];

  while (artists.length < 8) artists.push("ADD LINEUP");
  return artists;
};

const isImageAsset = (url = "") =>
  /\.(avif|gif|jpe?g|png|webp)(\?.*)?$/i.test(url);

const WEEK_LINEUP_SOUND_DELAY = 5000;
const REEL_MEDIA_PLAY_DELAY = 1400;

const buildFestival = (festival) => {
  const source = festival || demoFestival;
  const config = source.reel_config || {};

  return {
    ...demoFestival,
    ...source,
    date: formatDateRange(source.start_date, source.end_date),
    genre: config.custom_text || source.genre || demoFestival.genre,
    assetUrl: config.asset_url || config.video_url || "",
    artists: fillLineup(config.lineup),
    extraNote: config.extra_note || "and many more...",
  };
};

const ReelMedia = ({ assetUrl }) => {
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef(null);
  const hasAsset = Boolean(assetUrl) && !hasError;
  const mediaIsImage = useMemo(() => isImageAsset(assetUrl), [assetUrl]);

  useEffect(() => {
    setHasError(false);
  }, [assetUrl]);

  useEffect(() => {
    if (!hasAsset || mediaIsImage) return undefined;

    const video = videoRef.current;
    if (!video) return undefined;

    video.pause();
    video.currentTime = 0;

    const playTimer = window.setTimeout(() => {
      video.currentTime = 0;
      video.play().catch(() => {
        // Muted inline playback should be allowed, but keep rendering if a browser blocks it.
      });
    }, REEL_MEDIA_PLAY_DELAY);

    return () => {
      window.clearTimeout(playTimer);
      video.pause();
      video.currentTime = 0;
    };
  }, [assetUrl, hasAsset, mediaIsImage]);

  if (!hasAsset) {
    return (
      <div className="flex h-full w-full items-center justify-center px-6 text-center text-sm font-black uppercase leading-tight tracking-[0.18em] text-gold">
        ADD VIDEO OR IMAGE
      </div>
    );
  }

  if (mediaIsImage) {
    return (
      <img
        src={assetUrl}
        alt=""
        className="h-full w-full object-cover"
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <video
      ref={videoRef}
      src={assetUrl}
      muted
      playsInline
      preload="auto"
      className="h-full w-full object-cover"
      onError={() => setHasError(true)}
    />
  );
};

const ThisWeeksFestivalReel = ({ festival = demoFestival }) => {
  const reelFestival = buildFestival(festival);

  useEffect(() => {
    const introSoundTimer = window.setTimeout(() => {
      playSound("weekIntro");
    }, 1200);

    const lineupSoundTimer = window.setTimeout(() => {
      playSound("weekLineup");
    }, 400 + WEEK_LINEUP_SOUND_DELAY);

    return () => {
      window.clearTimeout(introSoundTimer);
      window.clearTimeout(lineupSoundTimer);
      soundManager.stopMany(["weekIntro", "weekLineup"]);
    };
  }, []);

  return (
    <div className="relative aspect-[9/16] h-[720px] overflow-hidden bg-black text-gold">
      <div className="pointer-events-none absolute inset-0 z-50">
        {/* top border: left to right */}
        <motion.div
          className="absolute left-0 top-0 h-[2px] bg-[#70520a] "
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{
            duration: 3.75,
            ease: "linear",
          }}
        />

        {/* right border: top to bottom */}
        <motion.div
          className="absolute right-0 top-0 w-[1px] bg-[#70520a] "
          initial={{ height: "0%" }}
          animate={{ height: "100%" }}
          transition={{
            delay: 3.75,
            duration: 3.75,
            ease: "linear",
          }}
        />

        {/* bottom border: right to left */}
        <motion.div
          className="absolute bottom-0 right-0 h-[1px] bg-[#70520a] "
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{
            delay: 7.5,
            duration: 3.75,
            ease: "linear",
          }}
        />

        {/* left border: bottom to top */}
        <motion.div
          className="absolute bottom-0 left-0 w-[1px] bg-[#70520a] "
          initial={{ height: "0%" }}
          animate={{ height: "100%" }}
          transition={{
            delay: 11.25,
            duration: 3.75,
            ease: "linear",
          }}
        />
      </div>
      {/* background atmosphere */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0, scale: 1.15 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.4, ease: "easeOut" }}
        style={{
          background:
            "radial-gradient(circle at top, rgba(255,186,0,0.22), transparent 38%), linear-gradient(to bottom, #000, #090705, #000)",
        }}
      />
      {/* slow pulsing background glow */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0, 0.35, 0.18, 0.32],
          scale: [1, 1.08, 1.03, 1.1],
        }}
        transition={{
          duration: 15,
          ease: "easeInOut",
        }}
        style={{
          background:
            "radial-gradient(circle at center, rgba(255,186,0,0.18), transparent 48%)",
        }}
      />
      {/* animated noise / grid overlay */}
      <motion.div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,186,0,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,186,0,.08) 1px, transparent 1px)",
          backgroundSize: "42px 42px",
        }}
        animate={{ backgroundPosition: ["0px 0px", "42px 84px"] }}
        transition={{ duration: 15, ease: "linear" }}
      />

      {/* golden scanning light */}
      <motion.div
        className="absolute left-0 top-0 h-full w-[140px] bg-gradient-to-r from-transparent via-gold/20 to-transparent blur-2xl"
        initial={{ x: -180 }}
        animate={{ x: 620 }}
        transition={{ duration: 15, ease: "linear" }}
      />
      <motion.div
        className="relative z-10 flex h-full flex-col justify-between p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* header animation */}
        <motion.header
          className="space-y-2 center flex-col"
          initial={{ y: -24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.7, ease: "easeOut" }}
        >
          <motion.p
            className="text-xs uppercase tracking-[0.45em] text-cream/70 secondary"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.75, 1] }}
            transition={{ delay: 0.5, duration: 1.2 }}
          >
            Soundfolio Presents
          </motion.p>
          <motion.h2
            className="text-2xl font-bold uppercase leading-none"
            initial={{ letterSpacing: "0.02em", opacity: 0 }}
            animate={{ letterSpacing: "0.06em", opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
          >
            This Week's Festival
          </motion.h2>
        </motion.header>
        {/* main festival content */}
        <section className="relative flex flex-1 flex-col items-center justify-center py-3">
          {/* video logo animation */}
          <motion.div
            className="relative h-[150px] w-[200px] rounded-full mb-7"
            initial={{ scale: 0.55, opacity: 0, rotate: -8 }}
            animate={{
              scale: [0.55, 1.08, 1],
              opacity: 1,
              rotate: 0,
            }}
            transition={{ delay: 1.4, duration: 1.1, ease: "easeOut" }}
          >
            <div className="festival-glow-ring" />
            <div className="relative z-10 h-full w-full overflow-hidden border border-gold/50 bg-black">
              <ReelMedia assetUrl={reelFestival.assetUrl} />
            </div>
          </motion.div>

          {/* festival name animation */}
          <motion.div
            className="my-6 text-center"
            initial={{ y: 36, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ delay: 3.0, duration: 0.7, ease: "easeOut" }}
          >
            <h1 className="text-3xl font-black uppercase leading-none">
              {reelFestival.name}
            </h1>
            {/* location and date animation */}
            <motion.div
              className="flex items-center justify-center gap-2 uppercase text-golds"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3.6, duration: 0.6 }}
            >
              <ArtistCountry
                artistCountry={{
                  country: reelFestival.country,
                  city: reelFestival.city,
                }}
              />
              <span className="text-gold/50">•</span>
              <span className="secondary text-[10px] font-bold text-cream">
                {reelFestival.date}
              </span>
            </motion.div>
            {/* genre animation */}
            <motion.p
              className="mt-2 text-xs uppercase tracking-[0.4em] text-black font-bold pt-0.5 border bg-gold"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 4.2, duration: 0.5 }}
            >
              {reelFestival.genre}
            </motion.p>
          </motion.div>

          {/* artists headline animation */}
          <motion.div
            className="mt-5 w-full"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 5.0, duration: 0.6 }}
          >
            <p className=" text-center text-xs uppercase mb-2 tracking-[0.45em] text-chino secondary">
              Featuring
            </p>
            {/* artists list animation */}
            <div className="grid grid-cols-2 gap-2">
              {reelFestival.artists.map((artist, index) => (
                <motion.div
                  key={`${artist}-${index}`}
                  className="border border-cream/30 bg-cream/15 text-cream px-3 py-1 text-center text-sm uppercase font-bold backdrop-blur"
                  initial={{ opacity: 0, y: 18, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    delay: 5.4 + index * 0.32,
                    duration: 0.45,
                    ease: "easeOut",
                  }}
                >
                  {artist}
                </motion.div>
              ))}
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 7.5, duration: 0.6 }}
            className="secondary text-[9px] text-chino tracking-[0.45em] uppercase mt-2"
          >
            {reelFestival.extraNote}
          </motion.h1>
        </section>

        {/* footer / CTA animation */}
        <motion.footer
          className="border-t border-gold/30 pt-5 flex justify-between items-center"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 9, duration: 0.8, ease: "easeOut" }}
        >
          <div className=" flex flex-col justify-start items-start">
            <motion.p
              className="text-sm font-bold uppercase leading-tight"
              animate={{ opacity: [1, 0.65, 1] }}
              transition={{
                delay: 9.5,
                duration: 1.1,
                repeat: 1,
                repeatType: "reverse",
              }}
            >
              Full lineup, ticket info and more on
            </motion.p>

            <motion.p
              className="secondary text-sm uppercase tracking-[0.35em] text-cream/80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 9.7, duration: 0.5 }}
            >
              Soundfolio.net
            </motion.p>
          </div>
          <motion.div
            className="flex items-center justify-end"
            initial={{
              x: 120,
              opacity: 0,
              rotate: 180,
              scale: 0.5,
            }}
            animate={{
              x: 0,
              opacity: 1,
              rotate: 0,
              scale: 1,
            }}
            transition={{
              delay: 10.5,
              duration: 0.8,
              ease: "easeOut",
            }}
          >
            <img
              src="/assets/elivagar-logo.png"
              alt="Elivagar Logo"
              className="h-10 w-10 sepia"
            />
          </motion.div>
        </motion.footer>
      </motion.div>
    </div>
  );
};

export default ThisWeeksFestivalReel;
