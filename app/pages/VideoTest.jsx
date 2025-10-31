"use client"
import React, { useEffect, useRef, useState } from 'react'
import {motion, useAnimation} from 'framer-motion'
import { Michroma } from 'next/font/google'
import { MdEvent } from 'react-icons/md'
import { SiNeteasecloudmusic, SiYoutubemusic } from 'react-icons/si'
import { FaPause, FaPlay, FaUsers } from "react-icons/fa";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

// Built for everyone who lives through sound — artists, clubs, and fans, connected in one place. powered by your contribution to something greater.

const michroma = Michroma({
  weight: '400',
  subsets: ['latin'],
})

const VideoTest = () => {
  return (
   <>
    <div className=' flex flex-col min-h-screen gap-20 relative overflow-hidden'>
        <Twinkls />
        <CommunityCards />
        <ConnectionLines />
        <CommunityTransition />
        <Beats />
        <AnimateLogo />
    </div>
        <div className="h-screen w-full center">
          <Cues />
        </div>
   </>
  )
}


const AnimateLogo = () => {
    return  (
     <motion.div 
       initial={{scale: 0}}
       animate={{scale: 1}}
       transition={{
        duration: 0.3, 
        delay: 25.5 ,  
        type: "spring",
        stiffness: 120,            
        damping: 20
        }}
      className='flex flex-col bg-black items-center gap-10 h-screen center w-full absolute inset-0 z-[15]'>
     <div className={`w-80 h-[260px] relative sepia overflow-hidden`}>
      <motion.img 
         initial={{opacity:0}} 
         animate={{opacity:[0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 0]}} 
         transition={{
            duration: 2,
            delay: 28,
            times: [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 0.921, 0.958, 0.979, 1],
        }} 
          src="/assets/glich.logo.png" 
          alt="gliched logo" 
          className="w-full h-auto border absolute -top-13 scale-120 z-[30] left-0"
      />
  {/* Nose - animates last with rotation */}
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
              delay: 27.9, // 25.5 + 0.3 (container) + 0.5 (neck) + 0.3 (muceli) + 0.8
         }}
        />
  {/* Neck - animates on "WELCOME" - FIRST */}
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
                 delay: 26.3, // 25.5 + 0.3 (container animation)
             }}
        />
  
  {/* Wing-1 - animates 4th with rotation */}
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
      delay: 27.8, // 25.5 + 0.3 (container) + 0.5 (neck) + 0.3 (muceli) + 0.7
    }}
  />
  
  {/* Wing-2 - animates 3rd with rotation */}
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
      delay: 27.7, // 25.5 + 0.3 (container) + 0.5 (neck) + 0.3 (muceli) + 0.6
    }}
  />
  
  {/* Feather - animates 2nd with rotation */}
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
      delay: 27.6, // 25.5 + 0.3 (container) + 0.5 (neck) + 0.3 (muceli) + 0.5
    }}
  />
  
  {/* Muceli - animates on "TO" - SECOND */}
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
      delay: 26.8 // 25.5 + 0.3 (container) + 0.5 (neck)
    }}
  />
  
  {/* Tail - animates 1st (on "SOUNDFOLIO") with rotation */}
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
      delay: 27.5, // 25.5 + 0.3 (container) + 0.5 (neck) + 0.3 (muceli) + 0.4
    }}
  />
    </div>
    <h1 className={`${michroma.className} font-bold text-3xl relative z-10`}>
        <motion.img 
    src="/assets/title-2.png" 
    alt="title-1" 
    className="absolute -top-0.5 scale-104 left-0 inset-0 z-20"
    initial={{ opacity: 0 }}
    animate={{ 
      opacity: [0, 1, 1, 0] 
    }}
    transition={{
      duration: 3.2,
      delay: 28.5,
      times: [0, 0.4 , 0.8, 1],
      ease: "easeInOut"
    }}
  />
       {"SOUNDFOLIO".split("").map((letter, index) => (
        <motion.span
        key={index}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
            duration: 0.3,
            delay: 27.8 + (index * 0.1), // 25.5 + 0.3 (container) + 0.5 (neck) + 0.3 (muceli) + 0.7
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

const CommunityCards = () => {
  const cards = [
    {
      type: "artist",
      title: "Add Artist",
      description:
        "Submit a new DJ or electronic music artist to our database. Help expand our community's music collection.",
      icon: <SiYoutubemusic />,
      position: "absolute top-20 left-[50%] -translate-x-1/2"
    },
    {
      type: "club",
      title: "Register Club",
      description:
        "Add a new venue or club to our directory. Share the best spots for electronic music events.",
      icon: <SiNeteasecloudmusic />,
      position: "absolute bottom-25 left-90"
    },
    {
      type: "event",
      title: "Submit Event",
      description:
        "Create and manage your upcoming events. Connect with fans and promote your shows.",
      icon: <MdEvent />,
      position: "absolute bottom-25 right-90 "
    },
  ];

  return (
    <>
      {cards.map(({ type, title, description, icon: Icon, position }, index) => (
        <motion.div
        className={`${position} bg-gradient-to-br from-gold/20 to-gold/10 border border-gold/30 rounded-lg p-3 w-64 z-[1]`}
          key={type}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            duration: 0.5,
            delay: index * 0.5,
            ease: "easeOut"
          }}
        >
          <div className="text-center space-y-2">
            <div className="mx-auto text-2xl w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center group-hover:bg-gold/30 transition-colors duration-300">
              <span>{Icon}</span>
            </div>
            <h3 className="text-xl font-bold text-gold group-hover:text-gold/90 transition-colors duration-300">
              {title}
            </h3>
            <p className="text-xs text-chino/80 leading-relaxed">
              {description}
            </p>
          </div>
        </motion.div>
      ))}
    </>
  );
};

const ConnectionLines = () => {
  const connections = [
    {
      className: "h-0.5 w-80 top-86 right-100 rotate-225 origin-center",
      delay: 3.5
    },
    {
      className: "h-0.5 w-80 top-86 left-100 -rotate-225 ",
      delay: 2.5
    },
    {
      className: "h-0.5 w-96 bottom-45 left-1/2 -translate-x-1/2",
      delay: 3
    }
  ];

  return (
    <>
      {connections.map((connection, connIndex) => (
        <div 
          key={connIndex}
          className={`absolute ${connection.className} flex z-0 items-center justify-around px-15`}
          style={{ zIndex: 0 }}
        >
          {Array.from({ length: connIndex === 2 ? 15 : 10 }).map((_, dashIndex) => (
            <motion.div
              key={dashIndex}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{
                duration: 0.2,
                delay: connection.delay + dashIndex * 0.1,
                ease: "easeOut"
              }}
              className="w-3 h-1 bg-yellow-600 rounded-full"
            />
          ))}
        </div>
      ))}
    </>
  );
};

const CommunityTransition = () => {
  return (
    <>
      <motion.div 
          className='absolute top-[54%] left-2/4 -translate-x-2/4 -translate-y-2/4 z-[3]'
          initial={{scale: 0, y: 0}} 
          animate={{
            scale: [0, 1, 1, 100],
            y: [0, 0, 0, 600]
          }} 
          transition={{
            delay: 6.5,
            duration: 9,
            times: [0, 0.072, 0.278, 0.333],
            ease: ["easeOut", "linear", "easeIn"]
            }} 
        >
          <FaUsers className='text-7xl text-gold' />
        </motion.div>
        {/* Covering black bars */}
    <motion.div 
        initial={{y: -700}} 
        animate={{y: 0}}
        transition={{
            delay: 14.5,
            duration: 2,
        }}
        style={{transformOrigin: "top"}}
        className='absolute z-[4] bg-black w-full h-2/4 top-0 left-0'
    />
    <motion.div 
        initial={{y: 700 }} 
        animate={{y: 0 }}
        transition={{
            delay: 14.5,
            duration: 2,
        }}
        style={{transformOrigin: "bottom"}}
        className='absolute z-[4] bg-black w-full h-2/4 bottom-0 left-0'
    />
          <motion.img 
            initial={{x: -700}} 
            animate={{x: 0, scale: [1, 1, 0]}} 
            transition={{
                x: {
                    duration: 0.3, 
                    delay: 9.5,
                    type: "spring",
                    stiffness: 100,
                    damping: 15
                },
                scale: {
                    duration: 0.4,
                    delay: 16.5,
                    ease: "easeInOut"
                }
            }} 
            src="/assets/2.png" 
            alt="events" 
            className='w-86 h-auto z-[25] absolute top-[9%] left-[8%] -rotate-16 '
        />
        <motion.img 
            initial={{y: 700, x: -700}} 
            animate={{y: 0, x: 0, scale: [1, 1, 0]}} 
            transition={{
                x: {
                    duration: 0.3, 
                    delay: 9.9,
                    type: "spring",
                    stiffness: 120,
                    damping: 20
                },
                y: {
                    duration: 0.3, 
                    delay: 9.9,
                    type: "spring",
                    stiffness: 120,
                    damping: 20
                },
                scale: {
                    duration: 0.4,
                    delay: 16.5,
                    ease: "easeInOut"
                }
            }} 
            src="/assets/4.png" 
            alt="reviews" 
            className='w-64 h-auto z-[25] absolute bottom-[10%] left-[16%] rotate-8 '
        />
        <motion.img 
            initial={{y: 700}} 
            animate={{y: 0, scale: [1, 1, 0]}} 
            transition={{
                y: {
                    duration: 0.3, 
                    delay: 10.1,
                    type: "spring",
                    stiffness: 80,
                    damping: 12
                },
                scale: {
                    duration: 0.4,
                    delay: 16.5,
                    ease: "easeInOut"
                }
            }} 
            src="/assets/3.png" 
            alt="artist" 
            className='w-86 h-auto z-[25] absolute bottom-[10%] right-[42%] -rotate-4 '
        />
        <motion.img 
            initial={{x: 700, y: 700}} 
            animate={{x: 1, y: 0, scale: [1, 1, 0]}} 
            transition={{
                x: {
                    duration: 0.3, 
                    delay: 10.3,
                    type: "spring",
                    stiffness: 90,
                    damping: 18
                },
                y: {
                    duration: 0.3, 
                    delay: 10.3,
                    type: "spring",
                    stiffness: 90,
                    damping: 18
                },
                scale: {
                    duration: 0.4,
                    delay: 16.5,
                    ease: "easeInOut"
                }
            }} 
            src="/assets/5.png" 
            alt="likes" 
            className='w-86 h-auto z-[25] absolute bottom-[10%] right-[16%] -rotate-12 '
        />
        <motion.img 
            initial={{x: -700, y: -700}} 
            animate={{x: 0, y: 0, scale: [1, 1, 0]}} 
            transition={{
                x: {
                    duration: 0.3, 
                    delay: 10.5,
                    type: "spring",
                    stiffness: 110,
                    damping: 16
                },
                y: {
                    duration: 0.3, 
                    delay: 10.5,
                    type: "spring",
                    stiffness: 110,
                    damping: 16
                },
                scale: {
                    duration: 0.4,
                    delay: 16.5,
                    ease: "easeInOut"
                }
            }} 
            src="/assets/1.png" 
            alt="books" 
            className='w-86 h-auto z-[25] absolute top-[6%] right-[12%] rotate-4 '
        />
        <motion.img 
            initial={{y: -700}} 
            animate={{y: 0, scale: [1, 1, 0]}} 
            transition={{
                y: {
                    duration: 0.3, 
                    delay: 10.7,
                    type: "spring",
                    stiffness: 95,
                    damping: 14
                },
                scale: {
                    duration: 0.4,
                    delay: 16.5,
                    ease: "easeInOut"
                }
            }} 
            src="/assets/7.png" 
            alt="club" 
            className='w-86 h-auto z-[25] absolute top-[8%] right-[40%] rotate-6 '
        />
 <motion.img 
  initial={{ scale: 0 }} 
  animate={{ scale: [0, 1, 1, 0] }} 
  transition={{
    scale: {
      times: [0, 0.3, 0.8, 1],  // smoother in → hold → out
      duration: 6.5,            // matches others’ visible duration
      delay: 10.9,              // aligns entry with rest
      ease: ["easeOut", "linear", "easeInOut"]
    }
  }} 
  src="/assets/6.png" 
  alt="ratings" 
  className="w-64 h-auto z-[25] absolute top-[30%] right-[45%]"
/>
    </>
  );
};

const Beats = () => {
   const artistVideoRef = useRef(null);
  const eventControls = useAnimation();
  const artistControls = useAnimation();
  const clubControls = useAnimation();

  useEffect(() => {
    // ENTER at ~19.5s
    const enterTimeout = setTimeout(() => {
      eventControls.start("enter");
      artistControls.start("enter");
      clubControls.start("enter");
    }, 19500);

    // EXIT at ~25.4s
    const exitTimeout = setTimeout(() => {
      eventControls.start("exit");
      artistControls.start("exit");
      clubControls.start("exit");
    }, 25400);

    return () => {
      clearTimeout(enterTimeout);
      clearTimeout(exitTimeout);
    };
  }, [eventControls, artistControls, clubControls]);

  // Variants
  const eventVariants = {
    hidden: { y: -700, opacity: 0 },
    enter: { y: 0, opacity: 1, transition: { duration: 0.3, ease: "easeInOut" } },
    exit: { y: -700, opacity: 0, transition: { duration: 0.4, ease: "easeInOut" } },
  };

  const artistVariants = {
    hidden: { x: -700, opacity: 0 },
    enter: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.4, ease: "easeInOut" },
    },
    exit: {
      x: -700,
      opacity: 0,
      transition: { duration: 0.4, ease: "easeInOut" },
    },
  };

  const clubVariants = {
    hidden: { y: 700, opacity: 0 },
    enter: { y: 0, opacity: 1, transition: { duration: 0.3, ease: "easeInOut" } },
    exit: { y: 700, opacity: 0, transition: { duration: 0.4, ease: "easeInOut" } },
  };
  const bars = [
    9, 18, 15, 23, 18, 32, 23, 18, 24, 17, 10, 15, 20, 25, 18, 12, 28, 16, 22, 14,
    19, 26, 13, 21, 17, 24, 11, 20, 18, 23, 15, 19, 27, 14, 22, 16, 25, 13, 20, 17,
    24, 12, 21, 18, 26, 15, 23, 19, 16, 22, 22, 16, 25, 13, 20, 17, 24, 12, 21, 18,
    26, 15, 23, 19, 16, 22, 22, 16, 25, 13, 20, 17, 24, 12, 21, 18, 26, 15, 23, 19,
    16, 22, 22, 16, 25, 13, 16, 22, 22, 16, 25, 13, 20, 17, 24, 12, 21, 18, 26, 15, 23, 19,
    16, 22, 22, 16, 25, 13, 22, 22, 16, 25, 13, 20, 17, 24, 12, 21, 18, 26, 15, 23, 19,
    16, 22, 22, 16, 25, 13,
  ];

  return (
   <>
    <motion.div
      initial={{
        opacity: 0,
        top: "50%",
        left: "50%",
        x: "-50%",
        y: "-50%",
      }}
      animate={{
        opacity: 1,
        top: ["45%", "7%"],
        left: ["55%", "10%"],
        x: ["-50%", "0%"],
        y: ["-50%", "0%"],
     }}
      transition={{
        opacity: { duration: 0.4, delay: 18.5 },
        top: { duration: 0.5, delay: 19.2, ease: "easeInOut" },
        left: { duration: 0.5, delay: 19.2, ease: "easeInOut" },
        x: { duration: 0.5, delay: 19.2, ease: "easeInOut" },
        y: { duration: 0.5, delay: 19.2, ease: "easeInOut" },
      }}
      className="flex items-center w-[750px] h-20 absolute z-10 space-x-[2px] overflow-hidden"
    >
      {bars.map((height, index) => (
        <motion.div
          key={index}
          className="w-0.5 bg-gold"
          animate={{
            height: [5, height, 5],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
            delay: index * 0.05,
          }}
        />
      ))}
    </motion.div>
  {/* Animated Videos */}
  <motion.video
        src="/assets/event-video.mp4"
        autoPlay
        muted
        playsInline
        className="absolute z-[21] right-15 top-10 w-[600px] rounded-2xl"
        variants={eventVariants}
        initial="hidden"
        animate={eventControls}
      />

      {/* Artist video */}
      <motion.video
        ref={artistVideoRef}
        src="/assets/artist-video.mp4"
        muted
        playsInline
        className="absolute z-[21] left-10 bottom-20 w-[750px] rounded-3xl"
        variants={artistVariants}
        initial="hidden"
        animate={artistControls}
        onAnimationComplete={() => {
          if (artistVideoRef.current) artistVideoRef.current.play();
        }}
      />

      {/* Club video */}
      <motion.video
        src="/assets/club-video.mp4"
        autoPlay
        muted
        playsInline
        className="absolute z-[21] right-15 bottom-20 w-[600px] rounded-2xl"
        variants={clubVariants}
        initial="hidden"
        animate={clubControls}
      />
   </>
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

const Cues = () => {
  return (
      
<div className="border-2 border-stone-600 p-1.5 rounded-full">
  <div className="flex items-center gap-4 w-44 h-44 bg-stone-900 rounded-full justify-center">
      <motion.div
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1, repeat: Infinity,  }}
      >
        <FaPlay className="text-green-500 text-5xl drop-shadow-[0_0_5px_#32a852]" />
      </motion.div>

      <motion.div
        className="bg-green-500 rotate-20 w-1 h-12 drop-shadow-[0_0_10px_#32a852]"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1, repeat: Infinity, }}
      />

      <motion.div
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1, repeat: Infinity,}}
      >
        <FaPause className="text-green-500 text-5xl drop-shadow-[0_0_5px_#32a852]" />
      </motion.div>
    </div>
</div>

  );
};

export default VideoTest



// Are you an artist sharing your sound with the world?
// Or a club owner shaping the nightlife?
// Maybe a promoter bringing people together through music.
// Soundfolio connects you all — in one place.
// Together, we build the community that moves electronic music forward.


//“Connect, discover, and track your activity and statistics. Own your rhythm. Soundfolio keeps it social.”

// Built for everyone who lives through sound — artists, clubs, events and fans, connected in one place. powered by your contribution to something greater.