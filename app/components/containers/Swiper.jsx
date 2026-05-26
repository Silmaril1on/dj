"use client";

import { Children, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

const Swiper = ({
  children,
  animate = true,
  cardWidth = 176,
  spacing = 12,
  className = "",
}) => {
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const [dragWidth, setDragWidth] = useState(0);

  const slides = useMemo(() => Children.toArray(children), [children]);

  useLayoutEffect(() => {
    const calculate = () => {
      if (!containerRef.current || !trackRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;
      const trackWidth = trackRef.current.scrollWidth;

      setDragWidth(Math.max(trackWidth - containerWidth, 0));
    };

    calculate();

    const observer = new ResizeObserver(calculate);
    observer.observe(containerRef.current);
    observer.observe(trackRef.current);

    return () => observer.disconnect();
  }, [slides.length, cardWidth, spacing]);

  const parentVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const childVariants = {
    hidden: {
      opacity: 0,
      y: 18,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.35,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.section
      ref={containerRef}
      className={`block lg:hidden w-full max-w-full overflow-hidden ${className}`}
      variants={animate ? parentVariants : undefined}
      initial={animate ? "hidden" : false}
      whileInView={animate ? "visible" : undefined}
      viewport={{ once: true, amount: 0.2 }}
    >
      <motion.div
        ref={trackRef}
        drag="x"
        dragConstraints={{
          right: 0,
          left: -dragWidth,
        }}
        dragElastic={0.06}
        dragMomentum
        className="flex w-max cursor-grab active:cursor-grabbing select-none"
        style={{ gap: `${spacing}px` }}
      >
        {slides.map((child, index) => (
          <motion.div
            key={index}
            variants={animate ? childVariants : undefined}
            className="shrink-0"
            style={{
              width: `${cardWidth}px`,
              minWidth: `${cardWidth}px`,
            }}
          >
            {child}
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  );
};

export default Swiper;
