"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import { resolveImage } from "@/app/helpers/utils";

const ProfilePoster = ({ src, alt = "Profile image", className = "" }) => {
  const resolvedSrc = resolveImage(src, "lg");

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.3 }}
      className={`lg:h-[550px] w-auto overflow-hidden ${className}`}
    >
      {resolvedSrc ? (
        <img
          src={resolvedSrc}
          alt={alt}
          loading="lazy"
          className="w-full lg:w-auto h-full object-cover"
        />
      ) : (
        <Image
          src="/assets/elivagar-logo.png"
          alt={alt}
          width={600}
          height={400}
          className="w-full lg:w-auto h-full object-cover"
        />
      )}
    </motion.div>
  );
};

export default ProfilePoster;
