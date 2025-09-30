"use client";
import { motion } from "framer-motion";
import Image from "next/image";

const PosterSide = ({ src, alt, className = "" }) => (
  
  <motion.div
    initial={{ opacity: 0, scale: 0 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3, delay: 0.3 }}
    className={`h-[450px] w-auto overflow-hidden ${className}`}
  >
    <Image
      src={src}
      alt={src}
      width={600}
      height={400}
      className="w-auto h-full"
    />
  </motion.div>
);

export default PosterSide;