'use client';
import { useEffect, useState } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';

const MotionCount = ({ data, title }) => {
  const [displayedCount, setDisplayedCount] = useState(0);
  const count = useMotionValue(0);

  useEffect(() => {
    const controls = animate(count, data, {
      duration: 1.8,
      ease: 'easeOut',
      onUpdate: (latest) => {
        setDisplayedCount(Math.floor(latest));
      },
    });
    return () => controls.stop();
  }, [data]);

  return (
    <div className="items-center h-full gap-2">
      <div className='border border-gold/30 px-5 bg-gold/20'>
        <motion.div
          className="text-5xl font-extrabold font-mono"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          {(displayedCount || 0).toLocaleString()}
        </motion.div>
      </div>
      <h1 className='text-sm'>{title}</h1>
    </div>
  );
};

export default MotionCount;
