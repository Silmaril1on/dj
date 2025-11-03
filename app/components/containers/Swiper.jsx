"use client"
import { motion } from "framer-motion";

const Swiper = ({ 
  children, 
  items, 
  animate = true,
  cardWidth = 176,
  spacing = 12,
  className = ""
}) => {
  const totalContentWidth = items.length * (cardWidth + spacing);
  const visibleWidth = typeof window !== 'undefined' ? window.innerWidth : 375;
  const maxScroll = totalContentWidth - visibleWidth + 50; 

  return (
    <section className={`block lg:hidden overflow-hidden ${className}`}>
      <motion.div
        drag="x"
        dragConstraints={{
          left: -maxScroll,
          right: 0,
        }}
        dragElastic={0.1}
        className="flex gap-3 cursor-grab active:cursor-grabbing"
        initial="hidden"
        animate="visible"
      >
        {children}
      </motion.div>
    </section>
  );
};

export default Swiper;
