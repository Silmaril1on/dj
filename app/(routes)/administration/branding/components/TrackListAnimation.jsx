"use client";
import { motion } from "framer-motion";
import Motion from "@/app/components/containers/Motion";
import LogoAnimation from "./LogoAnimation";
import Twinkles from "./Twinkles";

const TrackListAnimation = ({
  tracklist = false,
  className = "",
  episode = "001",
  tracks = [],
}) => {
  return (
    <div className="relative overflow-hidden">
      <Twinkles />
      <article
        className={`relative center h-screen max-h-[800px] ${className}`}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            duration: 0.3,
            delay: 0,
            type: "spring",
            stiffness: 120,
            damping: 20,
          }}
          className={`flex flex-col items-center center z-20 ${
            tracklist ? "gap-5" : " gap-10"
          }`}
        >
          <LogoAnimation />
          {tracklist && <TrackList episode={episode} tracks={tracks} />}
          <ElivagarLogo />
        </motion.div>
      </article>
    </div>
  );
};

const TrackList = ({ episode, tracks }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <motion.div
      className="secondary z-10 w-[500px] h-auto flex flex-col items-center gap-1"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <h1 className="font-light text-2xl mb-4">
        Essence Radio |{" "}
        <b className="font-bold uppercase lighting">Episode {episode}</b>
      </h1>
      {tracks.map((track, index) => (
        <motion.div
          key={index}
          variants={itemVariants}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative overflow-hidden text-cream text-[12px] px-1"
        >
          <span className="shimmer inline-block w-full">
            <span className="block opacity-90">{track}</span>
            <span
              className="shimmer-overlay block"
              style={{ animationDelay: `${4 + index * 0.1}s` }}
            >
              {track}
            </span>
          </span>
        </motion.div>
      ))}
    </motion.div>
  );
};

const ElivagarLogo = () => {
  return (
    <Motion
      animation="top"
      delay={2.5}
      className="w-64 h-20 center overflow-hidden"
    >
      <img
        src="/assets/elivagar.png"
        alt="Elivagar Logo"
        className="w-64 h-auto sepia"
        width={200}
        height={200}
      />
    </Motion>
  );
};

export default TrackListAnimation;
