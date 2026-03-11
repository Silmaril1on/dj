"use client";
import { useState, useEffect, useRef } from "react";
import Avatar from "@/app/(routes)/artists/[slug]/(components)/(hero-components)/Avatar";
import BasicInfo from "@/app/(routes)/artists/[slug]/(components)/(hero-components)/BasicInfo";
import { motion } from "framer-motion";
import Image from "next/image";

const SectionTwo = () => {
  const [artistData, setArtistData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set the artist name or slug you want to display
  const dataArtist = "korolova"; // Change this to any artist slug

  useEffect(() => {
    const fetchArtistData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/artists/artist-profile?slug=${dataArtist}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch artist data");
        }

        const data = await response.json();
        setArtistData(data.artist);
      } catch (err) {
        console.error("Error fetching artist:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (dataArtist) {
      fetchArtistData();
    }
  }, [dataArtist]);

  return (
    <div className="w-[1240px] bg-black h-[940px] relative center flex-col border border-gold">
      <div className="h-[75%] overflow-hidden relative z-10 bg-black">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gold text-xl">Loading artist...</p>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-full">
            <p className="text-red-400 text-xl">Error: {error}</p>
          </div>
        )}

        {!loading && !error && artistData && (
          <div className="grid lg:grid-cols-2 gap-2 lg:gap-5 items-center min-h-[80vh] p-3 lg:p-5 relative ">
            <div className="absolute w-[610px] h-full z-100 top-0 left-0 bg-gradient-to-t from-black from-20% to-transparent to-55%" />
            <Avatar data={artistData} />
            <BasicInfo data={artistData} />
          </div>
        )}
      </div>
      <div className="flex pt-5 flex-1 flex-col items-start justify-center pl-10 relative w-full">
        <motion.div className="text-7xl text-cream flex flex-row font-thin rounded-md  px-10 pt-5 pb-4 backdrop-blur-[4px] bg-gold/20 border border-gold/10">
          <h1>Welcome to</h1>{" "}
          <TextAnim text="SOUNDFOLIO" shouldAnimate={!loading && artistData} />
        </motion.div>
        <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{
            rotate: {
              duration: 3.5,
              delay: 4,
              repeat: Infinity,
              ease: "linear",
            },
          }}
          className="w-34 h-34 p-3 absolute top-15 bg-gold/20 right-15 backdrop-blur-sm border border-gold/20 rounded-full center "
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
    </div>
  );
};

const TextAnim = ({ text = "Elivagar", shouldAnimate = false }) => {
  return (
    <motion.h1
      initial="hidden"
      animate={shouldAnimate ? "visible" : "hidden"}
      transition={{
        delayChildren: shouldAnimate ? 0.95 : 0,
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

export default SectionTwo;
