"use client";

import { formatBirthdate } from "@/app/helpers/utils";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { motion, AnimatePresence } from "framer-motion";
import ArtistCountry from "@/app/components/materials/ArtistCountry";
import Close from "@/app/components/buttons/Close";

// SSR-safe dynamic import
const GlobeGL = dynamic(
  () => import("react-globe.gl").then((m) => m.default ?? m),
  { ssr: false },
);

// ─── Futuristic palette ───────────────────────────────────────────────────────
const GLOBE_IMG_URL = "/globe/earth-night.jpg";
const GLOBE_BUMP_URL = "/globe/earth-topology.png";
const ATMOSPHERE_COLOR = "#00d4ff";
const ATMOSPHERE_ALTITUDE = 0.22;
const RING_COLOR = () => "rgba(252,185,19,0.45)";

// ─── Festival Card ────────────────────────────────────────────────────────────
const FestivalCard = ({ festival, onClose }) => {
  if (!festival) return null;

  const dateLabel =
    festival.start_date && festival.end_date
      ? `${formatBirthdate(festival.start_date)} – ${formatBirthdate(festival.end_date)}`
      : festival.start_date
        ? formatBirthdate(festival.start_date)
        : "Date TBA";

  return (
    <AnimatePresence>
      <motion.div
        key="festival-card"
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ duration: 0.25 }}
        className="absolute flex items-center justify-between z-30 bottom-10 left-1/2 -translate-x-1/2 w-[320px] bg-black/90 border border-gold/30"
      >
        {festival.image && (
          <div className="relative w-28 h-28 overflow-hidden">
            <img
              src={festival.image}
              alt={festival.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50" />
          </div>
        )}

        <div className="p-2 space-y-2.5 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-cream font-bold text-sm uppercase leading-tight tracking-wide">
                {festival.name}
              </p>
              <ArtistCountry
                artistCountry={{
                  country: festival.country,
                  city: festival.city,
                }}
              />
            </div>
            <Close onClick={onClose} />
          </div>

          <div className="flex flex-col items-censtartter gap-2">
            <span className="text-chino font-bold text-[10px]">
              {dateLabel}
            </span>
          </div>

          <a
            href={`/festivals/${festival.slug}`}
            className="  text-gold/80 text-xs font-bold uppercase tracking-widest hover:text-gold transition-colors"
          >
            View Festival →
          </a>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Festival pin (JSX rendered into a DOM element via createRoot) ───────────
const FestivalPin = ({ festival }) => {
  return (
    <div
      className="flex flex-col items-center gap-0.5 cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        window.dispatchEvent(
          new CustomEvent("globe:festival-click", { detail: festival }),
        );
      }}
    >
      <div className={`w-10 h-10 rounded-full overflow-hidden  }`}>
        {festival.image ? (
          <img
            src={festival.image}
            alt={festival.name}
            loading="lazy"
            className="w-full h-full object-cover block"
          />
        ) : (
          <div className="w-full h-full bg-[#2d1800] flex items-center justify-center text-[6px] text-gold font-bold">
            {(festival.name ?? "F").charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <span
        className={`text-xs font-bold uppercase tracking-[0.04em] bg-black/60 px-1 py-px rounded-sm whitespace-nowrap leading-[1.4] transition-colors duration-300 text-cream hover:text-gold`}
      >
        {festival?.name}
      </span>
    </div>
  );
};

// ─── Main Globe ───────────────────────────────────────────────────────────────
const Globe = () => {
  const globeRef = useRef(null);
  const containerRef = useRef(null);
  const [festivals, setFestivals] = useState([]);
  const [selectedFestival, setSelectedFestival] = useState(null);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Fetch upcoming festivals
  useEffect(() => {
    fetch("/api/festivals/globe")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setFestivals(json.festivals ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Stagger-reveal festival pins after data loads
  useEffect(() => {
    if (loading || festivals.length === 0) return;
    setVisibleCount(0);
    const step = Math.max(1, Math.floor(festivals.length / 20));
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= festivals.length) {
        setVisibleCount(festivals.length);
        clearInterval(timer);
      } else {
        setVisibleCount(current);
      }
    }, 80);
    return () => clearInterval(timer);
  }, [loading, festivals]);

  // Responsive sizing
  useEffect(() => {
    const update = () =>
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Disable auto-rotate — user must spin manually
  useEffect(() => {
    if (!globeRef.current) return;
    const controls = globeRef.current.controls();
    if (controls) {
      controls.autoRotate = false;
      controls.enableZoom = true;
      controls.minDistance = 150;
      controls.maxDistance = 700;
    }
  }, [loading]);

  // Listen for pin click events dispatched from HTML elements
  useEffect(() => {
    const handler = (e) => {
      const festival = e.detail;
      if (!festival) return;
      setSelectedFestival((prev) =>
        prev?.id === festival.id ? null : festival,
      );
      globeRef.current?.pointOfView(
        { lat: festival.lat, lng: festival.lng, altitude: 1.8 },
        900,
      );
    };
    window.addEventListener("globe:festival-click", handler);
    return () => window.removeEventListener("globe:festival-click", handler);
  }, []);

  // Prevent the page from scrolling when user wheels over the globe
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e) => e.preventDefault();
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const visibleFestivals = festivals.slice(0, visibleCount);

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black overflow-hidden"
      style={{ height: dimensions.height }}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <span className="text-gold text-xs uppercase tracking-widest animate-pulse">
            Loading festivals…
          </span>
        </div>
      )}

      <GlobeGL
        ref={globeRef}
        width={dimensions.width}
        height={dimensions.height}
        // Globe visuals
        globeImageUrl={GLOBE_IMG_URL}
        bumpImageUrl={GLOBE_BUMP_URL}
        backgroundColor="rgba(0,0,0,0)"
        atmosphereColor={ATMOSPHERE_COLOR}
        atmosphereAltitude={ATMOSPHERE_ALTITUDE}
        // Pulsing rings at every festival location
        ringsData={visibleFestivals}
        ringLat="lat"
        ringLng="lng"
        ringColor={RING_COLOR}
        ringMaxRadius={2.5}
        ringPropagationSpeed={2}
        ringRepeatPeriod={900}
        // Custom HTML pins
        htmlElementsData={visibleFestivals}
        htmlElement={(festival) => {
          const el = document.createElement("div");
          el.style.cssText =
            "pointer-events:auto;transform:translate(-50%,-100%);";
          createRoot(el).render(<FestivalPin festival={festival} />);
          return el;
        }}
        htmlTransitionDuration={300}
        htmlAltitude={0.01}
      />

      <FestivalCard
        festival={selectedFestival}
        onClose={() => setSelectedFestival(null)}
      />

      {/* Legend / stats */}
      <div className="absolute top-4 right-4 text-[10px] text-stone-500 uppercase space-y-1.5">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full inline-block"
            style={{ background: "#fcb913", boxShadow: "0 0 6px #fcb913" }}
          />
          <span className="text-gold/70">Upcoming festival</span>
        </div>
        <p className="text-stone-600">
          {festivals.length} upcoming
          {festivals.length !== 1 ? " festivals" : " festival"}
        </p>
      </div>
    </div>
  );
};

export default Globe;
