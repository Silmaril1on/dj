"use client";
import { motion } from "framer-motion";

const LogoAnimation = () => {
  return (
    <div className="w-80 h-[260px] relative sepia overflow-hidden">
      {/* Glitch logo */}
      <motion.img
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 0] }}
        transition={{
          duration: 2,
          delay: 2.5, // was 32.0 - 29.5
          times: [
            0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 0.921, 0.958, 0.979,
            1,
          ],
          repeat: Infinity,
          repeatDelay: 0,
        }}
        src="/assets/glitch-logo.png"
        alt="glitched logo"
        className="w-full h-auto border absolute -top-13 scale-120 z-30 left-0"
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
  );
};

export default LogoAnimation;
