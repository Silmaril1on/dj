"use client";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useRef, useEffect, useState } from "react";

const VerticalSwiper = ({
  children,
  items,
  cardHeight = 100,
  className = "",
}) => {
 const containerRef = useRef(null);
 const constraintsRef = useRef(null);
 const y = useMotionValue(0);
 const [containerHeight, setContainerHeight] = useState(0);

 useEffect(() => {
   if (!containerRef.current || !items?.length) return;

   const updateConstraints = () => {
     const height = containerRef.current.offsetHeight;
     setContainerHeight(height);
   };

   updateConstraints();
   window.addEventListener("resize", updateConstraints);
   return () => window.removeEventListener("resize", updateConstraints);
 }, [items?.length]);

 const handleDragEnd = (event, info) => {
   const totalHeight = items.length * cardHeight;
   const maxScroll = Math.min(0, -(totalHeight - containerHeight));

   // Snap back if out of bounds
   const currentY = y.get();

   if (currentY > 0) {
     animate(y, 0, { type: "spring", stiffness: 300, damping: 30 });
   } else if (currentY < maxScroll) {
     animate(y, maxScroll, { type: "spring", stiffness: 300, damping: 30 });
   }
 };

 if (!items?.length) return null;

 const totalHeight = items.length * cardHeight;
 const canScroll = totalHeight > containerHeight;

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      <motion.div
        ref={constraintsRef}
        className="flex flex-col"
        style={{
          y,
          cursor: canScroll ? "grab" : "default",
        }}
        drag={canScroll ? "y" : false}
        dragConstraints={{
          top: -(totalHeight - containerHeight),
          bottom: 10,
        }}
        dragElastic={0.1}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        whileDrag={{ cursor: "grabbing" }}
      >
        {children}
      </motion.div>
    </div>
  );
};


export default VerticalSwiper;