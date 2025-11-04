"use client"
import React, { useEffect, useState } from 'react'
import { Michroma } from 'next/font/google'
import {motion} from 'framer-motion'
import Particles, { initParticlesEngine } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'

const michroma = Michroma({
  weight: '400',
  subsets: ['latin'],
})

const ElivagarsContent = () => {
  return (
   <div className='min-h-screen w-full relative'>
       <Twinkls />
       {/* <AlbumPoster /> */}
       <SoundfolioAnimation />
       <TrackList />
   </div>
  )
}

const AlbumPoster = () =>{
  return (
     <div className='h-screen w-full center'>
       <div className='w-98 h-98 relative bg-stone-950'>
          <h1 className={`font-bold  absolute bottom-1 left-1 ${michroma.className}`}>Essence Radio 001</h1>
           <div className="absolute w-64 h-72 right-0 top-0 overflow-hidden rounded-bl-4xl">
             <img src="assets/elivagar.webp" alt="Essence Radio 001" className='w-full h-full object-cover' />
           </div>
           <img src="assets/elivagar-logo.png" alt="Essence Radio 001" className='w-20 h-20 object-cover ml-6 mt-1 sepia' />
       </div>
    </div>
  )
}

const SoundfolioAnimation = () => { 
  return (
    <motion.div 
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{
        duration: 0.3, 
        delay: 0,  // starts immediately
        type: "spring",
        stiffness: 120,            
        damping: 20
      }}
      className='flex flex-col items-center gap-10 center absolute inset-0 z-20'
    >
      <div className="w-80 h-[260px] relative sepia overflow-hidden">
        
        {/* Glitch logo */}
        <motion.img 
          initial={{ opacity: 0 }} 
          animate={{ opacity: [0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 0] }} 
          transition={{
            duration: 2,
            delay: 2.5, // was 32.0 - 29.5
            times: [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 0.921, 0.958, 0.979, 1],
            repeat: Infinity,
            repeatDelay: 0, 
          }} 
          src="/assets/glitch-logo.png" 
          alt="glitched logo" 
          className="w-full h-auto border absolute -top-13 scale-120 z-[30] left-0"
        />

        {/* Nose */}
        <motion.img
          src="/assets/vector-7.png"
          alt="nose"
          className="w-6 h-auto absolute top-[11%] left-[13%]"
          style={{ originX: 0.5, originY: 0.5 }}
          initial={{ opacity: 0, rotate: -180 }}
          animate={{ opacity: 1, rotate: 0 }}
          transition={{
            duration: 0.5,
            ease: "easeInOut",
            delay: 2.4, // was 31.9 - 29.5
          }}
        />

        {/* Neck */}
        <motion.img
          src="/assets/vector-6.png"
          alt="neck"
          className="w-16 h-auto absolute top-[11%] left-[21.5%]"
          style={{ originX: 0, originY: 0.5 }}
          initial={{ y: -300 }}
          animate={{ y: 0 }}
          transition={{
            duration: 0.5,
            ease: "easeInOut",
            delay: 0.8, // was 30.3 - 29.5
          }}
        />

        {/* Wing-1 */}
        <motion.img
          src="/assets/vector-3.png"
          alt="wing-1"
          className="w-22 h-auto absolute top-0 left-[37%]"
          style={{ originX: 0.5, originY: 1 }}
          initial={{ opacity: 0, rotate: 90 }}
          animate={{ opacity: 1, rotate: 0 }}
          transition={{
            duration: 0.5,
            ease: "easeInOut",
            delay: 2.3, // was 31.8 - 29.5
          }}
        />

        {/* Wing-2 */}
        <motion.img
          src="/assets/vector-4.png"
          alt="wing-2"
          className="w-22 h-auto absolute top-0 right-[6.5%]"
          style={{ originX: 0, originY: 1 }}
          initial={{ opacity: 0, rotate: -90 }}
          animate={{ opacity: 1, rotate: 0 }}
          transition={{
            duration: 0.5,
            ease: "easeInOut",
            delay: 2.2, // was 31.7 - 29.5
          }}
        />

        {/* Feather */}
        <motion.img
          src="/assets/vector-5.png"
          alt="feather"
          className="w-12 h-auto absolute top-[4.5%] right-[3%]"
          style={{ originX: 0, originY: 0 }}
          initial={{ opacity: 0, rotate: 180 }}
          animate={{ opacity: 1, rotate: 0 }}
          transition={{
            duration: 0.5,
            ease: "easeInOut",
            delay: 2.1, // was 31.6 - 29.5
          }}
        />

        {/* Muceli */}
        <motion.img
          src="/assets/vector-2.png"
          alt="muceli"
          className="w-34 h-auto absolute bottom-[23%] left-[21.5%]"
          style={{ originX: 0.5, originY: 0 }}
          initial={{ y: 300, x: -100 }}
          animate={{ y: 0, x: 0 }}
          transition={{
            duration: 0.5,
            ease: "easeInOut",
            delay: 1.3, // was 30.8 - 29.5
          }}
        />

        {/* Tail */}
        <motion.img
          src="/assets/vector-1.png"
          alt="tail"
          className="w-12 h-auto absolute right-[35%] bottom-0"
          style={{ originX: 0.5, originY: 0 }}
          initial={{ opacity: 0, rotate: -90 }}
          animate={{ opacity: 1, rotate: 0 }}
          transition={{
            duration: 0.5,
            ease: "easeInOut",
            delay: 2.0, // was 31.5 - 29.5
          }}
        />
      </div>

      {/* Title */}
      <h1 className={`${michroma.className} font-bold text-3xl relative z-10`}>
        <motion.img 
          src="/assets/elivagar-glitch.png" 
          alt="title-1" 
          className="absolute top-0.5 scale-104 left-0 inset-0 z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{
            duration: 3.2,
            delay: 3.0, // was 32.5 - 29.5
            repeat: Infinity,
            repeatDelay: 0,
            times: [0, 0.4, 0.8, 1],
            ease: "easeInOut"
          }}
        />
        {"ELIVAGAR".split("").map((letter, index) => (
          <motion.span
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.3,
              delay: 2.3 + index * 0.1, // was 31.8 + (index * 0.1) - 29.5
              ease: "easeInOut"
            }}
          >
            {letter}
          </motion.span>
        ))}
      </h1>
    </motion.div>
  )
}

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
        staggerChildren: 0.2, // delay between each item
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
      className="absolute secondary z-20 w-78 h-64 top-[40%] left-[55%] flex flex-col gap-1"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
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

const Twinkls = () =>{
    const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const particlesLoaded = (container) => {
    console.log(container);
  };
  return  (
      <>
      {init && (
        <Particles
          id="tsparticles"
          className="absolute z-20 inset-0"
          particlesLoaded={particlesLoaded}
          options={{
            fullScreen: { enable: false, zIndex: 0 },
            background: { color: { value: "transparent" } },
            particles: {
              size: {
                value: { min: 0.7, max: 1.1 }, // 👈 This controls the particle size range
                animation: {
                  enable: true, // set true if you want particles to "pulse" in size
                  speed: 2,      // pulsing speed
                  minimumValue: 1,
                  sync: false,   // false = each particle pulses individually
                },
              },
              number: { value: 100 },
              color: { value: "#fcf5df" },
              shape: { type: "star" },
              opacity: {
                value: { min: 0.1, max: 0.8 },
                animation: {
                  enable: true,
                  speed: 0.4,
                  minimumValue: 0.3,
                  sync: false, // each particle glows independently
                },
              },
              move: {
                enable: true,
                speed: 0.3,
                direction: "none",
                random: true,
                straight: false,
                outModes: { default: "out" },
              },
            },
            interactivity: {
              events: {
                onHover: { enable: true, mode: "repulse" },
                onClick: { enable: true, mode: "push" },
              },
              modes: {
                repulse: { distance: 100 },
                push: { quantity: 2 },
              },
            },
            detectRetina: true,
          }}
        />
      )}
    </>
  )
}





export default ElivagarsContent