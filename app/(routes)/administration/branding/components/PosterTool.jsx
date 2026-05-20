"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import BorderSvg from "@/app/components/materials/BorderSvg";
import Image from "next/image";

const START_POSITIONS = {
  radio: { x: 20, y: 40 },
  episode: { x: 104, y: 570 },
  name: { x: 250, y: 285 },
  logo: { x: 590, y: 500 },
};

const DraggableItem = ({ id, positions, setPositions, children }) => {
  const pos = positions[id];

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0}
      className="absolute left-0 top-0 z-20 cursor-grab active:cursor-grabbing select-none"
      style={{
        x: pos.x,
        y: pos.y,
      }}
      onDragEnd={(event, info) => {
        setPositions((prev) => ({
          ...prev,
          [id]: {
            x: Math.round(prev[id].x + info.offset.x),
            y: Math.round(prev[id].y + info.offset.y),
          },
        }));
      }}
    >
      {children}
    </motion.div>
  );
};

const PosterTool = () => {
  const [positions, setPositions] = useState(START_POSITIONS);

  return (
    <div className="h-screen w-full center z-10">
      <div className="relative w-[800px] h-[650px] overflow-hidden bg-stone-950">
        {/* POSTER BACKGROUND */}
        <Image
          src="/assets/album-poster.jpg"
          alt="Essence Radio 001"
          width={1500}
          height={1500}
          quality={100}
          priority
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* ESSENCE RADIO TEXT */}
        <DraggableItem
          id="radio"
          positions={positions}
          setPositions={setPositions}
        >
          <div className="relative w-fit center backdrop-blur-lg">
            <BorderSvg color="grey" strokeWidth={0.6} />
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
          setPositions={setPositions}
        >
          <div className="relative w-fit center px-4 pt-1 rounded-sm backdrop-blur-lg">
            <BorderSvg color="grey" strokeWidth={0.6} />
            <h1 className="text-3xl font-bold text-cream">024</h1>
          </div>
        </DraggableItem>

        {/* ELIVAGAR TEXT */}
        <DraggableItem
          id="name"
          positions={positions}
          setPositions={setPositions}
        >
          <div className="relative p-4 h-20 center backdrop-blur-lg">
            <BorderSvg color="grey" />
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

        {/* LOGO */}
        <DraggableItem
          id="logo"
          positions={positions}
          setPositions={setPositions}
        >
          <div className="relative rounded-xl backdrop-blur-xl">
            <BorderSvg color="grey" strokeWidth={0.6} />
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
