"use client"
import { motion } from 'framer-motion'
import SoundfolioAnimation from './SoundfolioAnimation'
import { useEffect, useState } from 'react'

const Shorties = () => {
   const [showSoundfolio, setShowSoundfolio] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSoundfolio(true)
    }, 16500) // 16.5 seconds

    return () => clearTimeout(timer)
  }, [])
  const items = [
    { name: 'News', count: 156, width: 'w-[45%]' },
    { name: 'Artists', count: 234, width: 'w-[65%]' },
    { name: 'Festivals', count: 847, width: 'w-[85%]' },
    { name: 'Events', count: 512, width: 'w-[65%]' },
    { name: 'Clubs', count: 1203, width: 'w-[45%]' },
  ]

  //Discover! From clubs to festivals, news to events, we keep you connected - All in one 
  //Rate, like, review, share, and book. make your mark on every event and artist.

  const itemsTwo = [
    { name: 'Like', width: 'w-[45%]' },
    { name: 'Rate', width: 'w-[65%]' },
    { name: 'Review', width: 'w-[85%]' },
    { name: 'Share', width: 'w-[65%]' },
    { name: 'Book', width: 'w-[45%]' },
  ]

  return (
    <div className="h-screen center">
           {showSoundfolio && <SoundfolioAnimation headline="soundfolio" />}
      {/* The flipping container */}
     <motion.div
      animate={{opacity: 0}} transition={{duration: 1, delay: 16}}
      >
       <motion.div
            initial={{ rotateY: 0, scale: 1 }}
            animate={{ rotateY: -180, scale: [1, 1, 0] }}
            transition={{ 
              rotateY: { duration: 2, ease: "easeInOut", delay: 7 },
              scale: { duration: 0.5, delay: 15.8, times: [0, 0.99, 1] }
            }}
            className="w-98 h-[600px] relative"
            style={{
              transformStyle: "preserve-3d",
            }}
        >
        {/* FRONT FACE */}
        <section
          className="w-98 bg-stone-950 z-10 h-[600px] absolute inset-0 flex flex-col justify-center gap-6 px-8"
          style={{
            backfaceVisibility: "hidden",
          }}
        >
        {/* FRONT PAGE CONTENT */}
        {items.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, width: 0 }}
            animate={{
              opacity: 1,
              width: item.width.match(/\d+/)[0] + '%'
            }}
            transition={{
              duration: 0.8,
              ease: "easeOut",
              delay: 0.6 + index * 0.1
            }}
            className="bg-gold ml-20 h-20 rounded-r-full flex justify-between items-center pl-3 pr-5 relative overflow-hidden"
          >
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.8 + index * 0.1 + 0.3 }}
              className="text-black text-3xl font-bold"
            >
              {item.name}
            </motion.h1>

            <motion.div
              initial={{ scale: 0, rotate: 0 }}
              animate={{ scale: 1, rotate: 360 }}
              transition={{
                scale: { duration: 1, delay: 0.8 + index * 0.1 + 0.8 },
                rotate: {
                  duration: 2,
                  delay: 0.8 + index * 0.1 + 1.8,
                  repeat: Infinity,
                  ease: "linear"
                }
              }}
              className="w-10 h-10 rounded-full center shadow-[-2px_-2px_10px_rgba(255,255,255,0.8),_2px_2px_10px_rgba(0,0,0,0.6)]"
            >
              <img src="/assets/elivagar-logo.png" alt="logo" className="w-8 h-8 brightness-0" />
            </motion.div>
          </motion.div>
        ))}

        {/* Decorative gradients */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1 }}
          className="bg-gradient-to-l from-gold/90 from-0% to-gold to-30% w-28 h-[195px] absolute left-[0.5px] top-[52px] overflow-hidden"
          style={{ clipPath: 'polygon(0 88%, 100% 0, 100% 41%, 0 100%)' }}>
          <motion.div initial={{ width: 112 }} animate={{ width: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="absolute right-0 top-0 h-full bg-stone-950" />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1 }}
          className="bg-gradient-to-l from-gold/90 from-0% to-gold to-30% w-28 h-[124px] absolute left-[0.5px] top-[156px] overflow-hidden"
          style={{ clipPath: 'polygon(0 81%, 100% 0, 100% 65%, 0 100%)' }}>
          <motion.div initial={{ width: 112 }} animate={{ width: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="absolute right-0 top-0 h-full bg-stone-950" />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1 }}
          className="bg-gradient-to-l from-gold/90 from-0% to-gold to-30% w-28 h-[81px] absolute top-[260px] left-[0.5px] overflow-hidden"
          style={{ clipPath: 'polygon(0 35%, 100% 0, 100% 100%, 0 68%)' }}>
          <motion.div initial={{ width: 112 }} animate={{ width: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="absolute right-0 top-0 h-full bg-stone-950" />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1 }}
          className="bg-gradient-to-l from-gold/90 from-0% to-gold to-30% w-28 h-[124px] absolute left-[0.5px] bottom-[155px] overflow-hidden"
          style={{ clipPath: 'polygon(0 19%, 100% 100%, 100% 35%, 0 0%)' }}>
          <motion.div initial={{ width: 112 }} animate={{ width: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="absolute right-0 top-0 h-full bg-stone-950" />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1 }}
          className="bg-gradient-to-l from-gold/90 from-0% to-gold to-30% w-28 h-[195px] absolute left-[0.5px] bottom-[51px] overflow-hidden"
          style={{ clipPath: 'polygon(0 12%, 100% 100%, 100% 59%, 0 0%)' }}>
          <motion.div initial={{ width: 112 }} animate={{ width: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="absolute right-0 top-0 h-full bg-stone-950" />
        </motion.div>
        </section>

        {/* BACK FACE */}
        <section
          className="w-98 bg-stone-950 z-10 h-[600px] absolute inset-0 flex flex-col justify-center items-end gap-6 px-8"
          style={{
            transform: "rotateY(180deg)",
            backfaceVisibility: "hidden",
          }}
        >
          {itemsTwo.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, width: 0 }}
              animate={{
                opacity: 1,
                width: item.width.match(/\d+/)[0] + '%'
              }}
              transition={{
                duration: 0.8,
                ease: "easeOut",
                delay: 9.6 + index * 0.1
              }}
              className="bg-gold mr-20 h-20 rounded-l-full flex justify-between items-center pl-5 pr-3 relative overflow-hidden"
            >
              <motion.div
                initial={{ scale: 0, rotate: 0 }}
                animate={{ scale: 1, rotate: 360 }}
                transition={{
                  scale: { duration: 1, delay: 9.8 + index * 0.1 + 0.8 },
                  rotate: {
                    duration: 2,
                    delay: 9.8 + index * 0.1 + 1.8,
                    repeat: Infinity,
                    ease: "linear"
                  }
                }}
                className="w-10 h-10 rounded-full center shadow-[-2px_-2px_10px_rgba(255,255,255,0.8),_2px_2px_10px_rgba(0,0,0,0.6)]"
              >
                <img src="/assets/elivagar-logo.png" alt="logo" className="w-8 h-8 brightness-0" />
              </motion.div>             
              <motion.h1
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 9.8 + index * 0.1 + 0.3 }}
                className="text-black text-3xl font-bold"
                style={{ transform: 'scaleX(-1)' }}
              >
                {item.name}
              </motion.h1>
            </motion.div>
          ))}

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.1, delay: 9 }}
            className="bg-gradient-to-r from-gold/90 from-0% to-gold to-30% w-28 h-[195px] absolute right-[0.5px] top-[52px] overflow-hidden"
            style={{ clipPath: 'polygon(100% 88%, 0 0, 0 41%, 100% 100%)' }}>
             <motion.div initial={{ width: 112 }} animate={{ width: 0 }} transition={{ duration: 0.8, ease: "easeOut", delay: 9 }} className="absolute left-0 top-0 h-full bg-stone-950" />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.1, delay: 9 }}
            className="bg-gradient-to-r from-gold/90 from-0% to-gold to-30% w-28 h-[124px] absolute right-[0.5px] top-[156px] overflow-hidden"
            style={{ clipPath: 'polygon(100% 81%, 0 0, 0 65%, 100% 100%)' }}>
            <motion.div initial={{ width: 112 }} animate={{ width: 0 }} transition={{ duration: 0.8, ease: "easeOut", delay: 9 }} className="absolute left-0 top-0 h-full bg-stone-950" />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.1, delay: 9 }}
            className="bg-gradient-to-r from-gold/90 from-0% to-gold to-30% w-28 h-[81px] absolute top-[260px] right-[0.5px] overflow-hidden"
            style={{ clipPath: 'polygon(100% 35%, 0 0, 0 100%, 100% 68%)' }}>
            <motion.div initial={{ width: 112 }} animate={{ width: 0 }} transition={{ duration: 0.8, ease: "easeOut", delay: 9 }} className="absolute left-0 top-0 h-full bg-stone-950" />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.1, delay: 9 }}
            className="bg-gradient-to-r from-gold/90 from-0% to-gold to-30% w-28 h-[124px] absolute right-[0.5px] bottom-[155px] overflow-hidden"
            style={{ clipPath: 'polygon(100% 19%, 0 100%, 0 35%, 100% 0%)' }}>
            <motion.div initial={{ width: 112 }} animate={{ width: 0 }} transition={{ duration: 0.8, ease: "easeOut", delay: 9 }} className="absolute left-0 top-0 h-full bg-stone-950" />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.1, delay: 9 }}
            className="bg-gradient-to-r from-gold/90 from-0% to-gold to-30% w-28 h-[195px] absolute right-[0.5px] bottom-[51px] overflow-hidden"
            style={{ clipPath: 'polygon(100% 12%, 0 100%, 0 59%, 100% 0%)' }}>
            <motion.div initial={{ width: 112 }} animate={{ width: 0 }} transition={{ duration: 0.8, ease: "easeOut", delay: 9 }} className="absolute left-0 top-0 h-full bg-stone-950" />
          </motion.div>
        </section>
      </motion.div>
     </motion.div>
    </div>
  )
}

export default Shorties
