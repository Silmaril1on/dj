"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

const FEATURED_ARTISTS = [
  "armin van buuren",
  "tiesto",
  "paul van dyk",
  "atb",
  "cosmic gate",
];

const SectionOne = () => {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.7; // 70% speed
    }
  }, []);

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const namesParam = encodeURIComponent(JSON.stringify(FEATURED_ARTISTS));
        const res = await fetch(`/api/artists/by-names?names=${namesParam}`);
        if (!res.ok) {
          throw new Error("Failed to fetch featured artists");
        }
        const data = await res.json();
        setArtists(data.artists || []);
      } catch (err) {
        console.error("SectionOne artists fetch error:", err);
        setError("Could not load featured artists");
      } finally {
        setLoading(false);
      }
    };

    fetchArtists();
  }, []);

  console.log(artists, "artists from COMMERCIAL");

  const dummyData = [
    {
      id: 1,
      name: "Armin van buuren",
      artist_image: "/assets/armin.png",
      artist_slug: "armin-van-buuren",
    },
    {
      id: 2,
      name: "Paul van dyk",
      artist_image: "/assets/pvd.png",
      artist_slug: "paul-van-dyk",
    },
    {
      id: 3,
      name: "tiesto",
      artist_image: "/assets/tiesto.png",
      artist_slug: "tiesto",
    },
    {
      id: 4,
      name: "Ferry corsten",
      artist_image: "/assets/ferry.png",
      artist_slug: "ferry-corsten",
    },
  ];

  return (
    <main className="w-[1240px] bg-black h-[940px] relative flex flex-col">
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          className="w-full h-full object-cover"
        >
          <source src="/assets/bg-video.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="grid grid-cols-4 w-full h-[70%] relative z-5">
        <div className="absolute inset-0 bg-gradient-to-t z-6 from-black from-5% to-transparent to-50%" />
        {dummyData.map((artist, index) => (
          <Link href={`/artists/${artist.artist_slug}`} key={artist.id}>
            <div className="h-full center flex-col relative">
              {index > 0 && (
                <div className="absolute left-0 w-0.5 h-[650px] z-2 inset-0 bg-gradient-to-b from-transparent via-cream to-transparent" />
              )}
              <div className="relative w-full h-full">
                <Image
                  src={artist.artist_image}
                  alt={artist.stage_name || artist.name}
                  width={800}
                  height={800}
                  className="w-full h-full object-cover hue-rotate-10"
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
        <motion.div className="text-7xl text-cream flex flex-row font-thin rounded-md  px-10 pt-5 pb-4 backdrop-blur-[4px] bg-cream/10 border border-cream/10">
          <h1>Artist profiles on</h1> <TextAnim text="SOUNDFOLIO" />
        </motion.div>
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
          className="w-34 h-34 absolute top-23 bg-cream/10 right-15 backdrop-blur-sm border border-cream/20 rounded-full center "
        >
          <Image
            // className="sepia"
            src="/assets/vynil.png"
            alt="logo"
            width={500}
            height={500}
          />
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
        delayChildren: 0.25,
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
