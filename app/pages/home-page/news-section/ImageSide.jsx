'use client'
import { motion } from "framer-motion";

  const imageVariants = {
    initial: {
      x: "-100%",
      opacity: 0,
    },
    animate: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
    exit: {
      x: "-100%",
      opacity: 0,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

const ImageSide = ({ currentNews }) => {
  return (
    <motion.div
      className="right-clip h-full w-2/4 left-[7.5%] lg:left-30 top-0 absolute"
      variants={imageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <img
        src={currentNews.news_image}
        alt="news"
        className="w-full h-full object-cover"
      />
    </motion.div>
  );
}

export default ImageSide