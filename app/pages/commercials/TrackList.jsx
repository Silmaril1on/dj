"use client";
import { motion } from 'framer-motion';

const TrackList = () => {
  const trackList = [
    "Moonwalk - In Your Mind",
    "Dominik Gehringer  Strange World",
    "Paradoks - Sea Of Infinity",
    "Anyma, Massano ft. Nathan Nicholson - Angel In The Dark",
    "Mia Mendi - Enter Machina (Moonwalk Remix)",
    "Laura Van Dam ft. Harry Diamond & K-MRK - Identify",
    "Agents Of Time - Zodiac",
    "D-Nox & Ed Steele - Comfort Zone",
    "Boris Brejcha - End of Time",
  ];

  // Parent (stagger control)
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  // Child (individual item animation)
  const itemVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <motion.div
      className="secondary z-10 w-78 h-auto flex flex-col items-center gap-1"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <h1 className='font-light'>Essence Radio | <b className='font-bold uppercase'>Eposode 002</b></h1>
      {trackList.map((track, index) => (
        <motion.div
          key={index}
          variants={itemVariants}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className=" text-cream text-[10px]"
        >
          {track}
        </motion.div>
      ))}
    </motion.div>
  );
};

export default TrackList;