"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

const SectionOne = () => {
  const videoRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !videoRef.current) return;

    const timer = setTimeout(() => {
      const video = videoRef.current;
      video.pause();
      video.currentTime = 0;
      video.playbackRate = 0.7;
      video.play();
    }, 1000);

    return () => clearTimeout(timer);
  }, [mounted]);

  const dummyData = [
    {
      id: 1,
      name: "Sarah De Warren",
      artist_image: "/artist-photos/sara.png",
      artist_slug: "sarah-de-warren",
      className: "w-full h-full object-cover object-[50%_center]",
    },
    {
      id: 2,
      name: "Nora En Pure",
      artist_image: "/artist-photos/nora.png",
      artist_slug: "nora-en-pure",
      className: " h-auto scale-260 pt-34 object-auto pr-5",
    },
    {
      id: 3,
      name: "Korolova",
      artist_image: "/artist-photos/koro.png",
      artist_slug: "korolova",
      className: "w-full object-cover h-full object-[50%_center]",
    },
    {
      id: 4,
      name: "Miss Monique",
      artist_image: "/artist-photos/mimo.png",
      artist_slug: "miss-monique",
      className: " w-full h-full object-cover object-[55%_center]",
    },
  ];

  return (
    <main className="w-[1240px] bg-black h-[940px] relative flex flex-col">
      <div className="absolute inset-0">
        {mounted && (
          <video
            ref={videoRef}
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="/assets/bg-video.mp4" type="video/mp4" />
          </video>
        )}
      </div>
      <div className="grid grid-cols-4 w-full h-[70%] relative z-5">
        <div className="absolute inset-0 bg-gradient-to-t z-6 from-black from-5% to-transparent to-50%" />
        {dummyData.map((artist, index) => (
          <Link href={`/artists/${artist.artist_slug}`} key={artist.id}>
            <div className="h-full center flex-col relative">
              {index > 0 && (
                <div className="absolute left-0 w-0.5 h-[650px] z-2 inset-0 bg-gradient-to-b from-transparent via-cream to-transparent" />
              )}
              <div className={`h-full relative duration-300 overflow-hidden`}>
                <Image
                  src={artist.artist_image}
                  alt={artist.stage_name || artist.name}
                  width={800}
                  height={800}
                  className={` ${artist.className}`}
                />
              </div>
              <p className="text-cream text-2xl font-bold uppercase z-10 ">
                {artist.stage_name || artist.name}
              </p>
            </div>
          </Link>
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-black from-70% to-transparent to-95%" />
      <div className="flex pt-10 flex-1 flex-col items-start justify-center pl-10 relative">
        {/* Vinyl Animation */}
        <div className="text-7xl text-cream flex flex-row font-thin rounded-md  px-10 pt-5 pb-4 backdrop-blur-[4px] bg-cream/10 border border-cream/10">
          <h1>Artist profiles on</h1> <TextAnim text="SOUNDFOLIO" />
        </div>
        {/* Vinyl Animation */}
        <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{
            rotate: {
              duration: 3.5,
              delay: 1.5,
              repeat: Infinity,
              ease: "linear",
            },
          }}
          className="w-34 h-34 p-3 absolute top-23 bg-cream/10 right-15 backdrop-blur-sm border border-cream/20 rounded-full center "
        >
          <Image src="/assets/vynil.png" alt="logo" width={500} height={500} />
        </motion.div>
      </div>
    </main>
  );
};

const TextAnim = ({ text = "Elivagar" }) => {
  return (
    <motion.h1
      initial="hidden"
      animate="visible"
      transition={{
        delayChildren: 2.25,
        staggerChildren: 0.1,
      }}
      className="text-7xl pl-2 uppercase font-bold relative block z-10 text-cream"
    >
      {text.split("").map((l, i) => {
        return (
          <motion.span
            key={i}
            variants={{
              hidden: {
                opacity: 0,
                x: -20,
              },
              visible: {
                opacity: 1,
                x: 0,
              },
            }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 10,
            }}
            className={`inline-block `}
          >
            {l}
          </motion.span>
        );
      })}
    </motion.h1>
  );
};

export default SectionOne;
