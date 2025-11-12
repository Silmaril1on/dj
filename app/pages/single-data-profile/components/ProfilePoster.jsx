"use client";
import { motion } from "framer-motion";
import Image from "next/image";

const ProfilePoster = ({ src, alt = "Profile image", className = "" }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3, delay: 0.3 }}
    className={`lg:h-[550px] w-auto overflow-hidden ${className}`}
  >
    <Image
      src={src}
      alt={alt}
      width={600}
      height={400}
      className="w-full lg:w-auto h-full object-cover"
    />
  </motion.div>
);

export default ProfilePoster;
