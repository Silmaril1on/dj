"use client";
import { motion } from "framer-motion";

const MotionLogo = ({className}) => {
  const foldVariants = {
    hidden: {
      opacity: 0,
      scale: 0.3,
      rotate: -45,
    },
    visible: (i) => ({
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: {
        delay: i * 0.15,
        duration: 0.6,
        ease: [0.34, 1.56, 0.64, 1],
      },
    }),
  };

  return (
      <div className={`w-80 h-[260px] relative sepia ${className}`}>
        <motion.img
          src="/assets/vector-7.png"
          alt="nose"
          className="w-6 h-auto absolute top-[11%] left-[13%]"
          variants={foldVariants}
          initial="hidden"
          whileInView="visible"
          custom={0}
          style={{ originX: 0.5, originY: 0.5 }}
        />
        <motion.img
          src="/assets/vector-6.png"
          alt="neck"
          className="w-16 h-auto absolute top-[11%] left-[21.5%]"
          variants={foldVariants}
          initial="hidden"
          whileInView="visible"
          custom={1}
          style={{ originX: 0, originY: 0.5 }}
        />
        <motion.img
          src="/assets/vector-3.png"
          alt="wing-1"
          className="w-22 h-auto absolute top-0 left-[37%]"
          variants={foldVariants}
          initial="hidden"
          whileInView="visible"
          custom={2}
          style={{ originX: 0.5, originY: 1 }}
        />
        <motion.img
          src="/assets/vector-4.png"
          alt="wing-2"
          className="w-22 h-auto absolute top-0 right-[6.5%]"
          variants={foldVariants}
          initial="hidden"
          whileInView="visible"
          custom={3}
          style={{ originX: 0, originY: 1 }}
        />
        <motion.img
          src="/assets/vector-5.png"
          alt="feather"
          className="w-12 h-auto absolute top-[4.5%] right-[3%]"
          variants={foldVariants}
          initial="hidden"
          whileInView="visible"
          custom={4}
          style={{ originX: 0, originY: 0 }}
        />
        <motion.img
          src="/assets/vector-2.png"
          alt="muceli"
          className="w-34 h-auto absolute bottom-[23%] left-[21.5%]"
          variants={foldVariants}
          initial="hidden"
          whileInView="visible"
          custom={5}
          style={{ originX: 0.5, originY: 0 }}
        />
        <motion.img
          src="/assets/vector-1.png"
          alt="tail"
          className="w-12 h-auto absolute right-[35%] bottom-0"
          variants={foldVariants}
          initial="hidden"
          whileInView="visible"
          custom={6}
          style={{ originX: 0.5, originY: 0 }}
        />
      </div>
  );
};

export default MotionLogo;
