"use client"
import { motion } from "framer-motion";
import ArtistCard from "@/app/pages/home-page/artists-section/ArtistCard";

const Swiper = ({ items, animate }) => {
  const cardWidth = 176; 
  const spacing = 12;
  const totalContentWidth = items.length * (cardWidth + spacing);
  const visibleWidth = window.innerWidth || 375;
  const maxScroll = totalContentWidth - visibleWidth + 50; 

  return (
    <section className="block lg:hidden overflow-hidden">
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
        {items.map((artist, index) => (
          <motion.div
            key={artist.id}
            className="flex-shrink-0"
            style={{ width: cardWidth }}
            initial={animate ? { opacity: 0, y: 30, scale: 0.9 } : false}
            animate={animate ? { opacity: 1, y: 0, scale: 1 } : false}
            transition={animate ? {
              duration: 0.5,
              delay: index * 0.1,
              ease: "easeOut"
            } : false}
          >
            <ArtistCard
              artist={artist}
              cardWidth={cardWidth}
              cardMargin={0}
              animate={false} 
            />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};

export default Swiper;
