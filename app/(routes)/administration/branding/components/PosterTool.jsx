"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import BorderSvg from "@/app/components/materials/BorderSvg";
import Image from "next/image";

const DEFAULT_POSITIONS = {
  radio: { x: 20, y: 40 },
  episode: { x: 104, y: 570 },
  name: { x: 250, y: 285 },
  logo: { x: 590, y: 500 },
};

function resolveInitialPositions(branding) {
  return {
    radio: branding?.radiotitle_pos ?? DEFAULT_POSITIONS.radio,
    episode: branding?.episode_pos ?? DEFAULT_POSITIONS.episode,
    name: branding?.elivagar_pos ?? DEFAULT_POSITIONS.name,
    logo: branding?.logo_pos ?? DEFAULT_POSITIONS.logo,
  };
}

const DraggableItem = ({ id, positions, onDragEnd, children }) => {
  const pos = positions[id];
  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0}
      className="absolute left-0 top-0 z-20 cursor-grab active:cursor-grabbing select-none"
      style={{ x: pos.x, y: pos.y }}
      onDragEnd={(event, info) => {
        onDragEnd(id, {
          x: Math.round(pos.x + info.offset.x),
          y: Math.round(pos.y + info.offset.y),
        });
      }}
    >
      {children}
    </motion.div>
  );
};

const PosterTool = ({ branding }) => {
  const [positions, setPositions] = useState(() =>
    resolveInitialPositions(branding),
  );
  const [saving, setSaving] = useState(false);

  const posterSrc =
    typeof branding?.poster_url === "string"
      ? branding.poster_url
      : "/assets/album-poster.jpg";

  const episodeLabel = branding?.episode_number
    ? String(branding.episode_number).padStart(3, "0")
    : "001";

  const handleDragEnd = useCallback((id, newPos) => {
    setPositions((prev) => ({ ...prev, [id]: newPos }));
  }, []);

  const saveCoordinates = useCallback(async () => {
    setSaving(true);
    try {
      await fetch("/api/admin/branding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          radiotitle_pos: positions.radio,
          episode_pos: positions.episode,
          elivagar_pos: positions.name,
          logo_pos: positions.logo,
        }),
      });
    } catch {
      // non-critical
    } finally {
      setSaving(false);
    }
  }, [positions]);

  return (
    <div className="h-screen w-full center z-10 relative ">
      <button
        type="button"
        disabled={saving}
        onClick={saveCoordinates}
        className="absolute left-10 top-6 mx-auto w-fit px-6 py-2 bg-gold text-black text-xs font-bold uppercase hover:bg-gold/80 disabled:opacity-50 transition-colors"
      >
        {saving ? "Saving..." : "Save Coordinates"}
      </button>

      <div className="relative w-[800px] h-[650px] overflow-hidden border border-white/50">
        {/* Poster background */}
        <Image
          src={posterSrc}
          alt="Essence Radio poster"
          width={1500}
          height={1500}
          quality={100}
          priority
          className="absolute inset-0 w-full h-full object-cover"
          unoptimized={posterSrc.startsWith("http")}
        />
        {/* ESSENCE RADIO TITLE */}
        <DraggableItem
          id="radio"
          positions={positions}
          onDragEnd={handleDragEnd}
        >
          <div className="relative w-fit center rounded-lg backdrop-blur-lg">
            <BorderSvg color="grey" strokeWidth={1} />
            <Image
              src="/assets/radiotitle.png"
              alt="Essence radio"
              width={300}
              height={100}
              draggable={false}
            />
          </div>
        </DraggableItem>
        {/* EPISODE NUMBER */}
        <DraggableItem
          id="episode"
          positions={positions}
          onDragEnd={handleDragEnd}
        >
          <div className="relative w-fit center px-4 pt-1 rounded-lg backdrop-blur-lg">
            <BorderSvg color="grey" strokeWidth={1} />
            <h1 className="text-3xl font-bold text-cream">{episodeLabel}</h1>
          </div>
        </DraggableItem>

        <DraggableItem
          id="name"
          positions={positions}
          onDragEnd={handleDragEnd}
        >
          <div className="relative p-4 h-20 center backdrop-blur-lg">
            <BorderSvg color="grey" strokeWidth={1} />
            <Image
              className="sepia mt-2"
              src="/assets/elivagar.png"
              alt="name"
              width={300}
              height={250}
              draggable={false}
            />
          </div>
        </DraggableItem>
        {/* LOGO elivagar logo*/}
        <DraggableItem
          id="logo"
          positions={positions}
          onDragEnd={handleDragEnd}
        >
          <div className="relative rounded-xl backdrop-blur-xl">
            <BorderSvg color="grey" strokeWidth={1} />
            <Image
              className="sepia"
              src="/assets/elivagar-logo.png"
              alt="logo"
              width={130}
              height={130}
              draggable={false}
            />
          </div>
        </DraggableItem>
      </div>
    </div>
  );
};

export default PosterTool;
