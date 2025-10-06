"use client"
import { motion } from 'framer-motion'
import Image from 'next/image'

const Avatar = ({ data }) => {

  return (
    <motion.div
      className="relative group"
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="relative overflow-hidden shadow-2xl">
        <motion.div
          className="relative w-full h-[400px] lg:h-[700px]"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          <Image
            src={data.artist_image}
            alt={data.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default Avatar