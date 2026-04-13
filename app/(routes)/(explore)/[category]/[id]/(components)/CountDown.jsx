"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoMdArrowDropleft, IoMdArrowDropright } from "react-icons/io";

const pad = (n) => String(n).padStart(2, "0");

const getTimeLeft = (targetDate) => {
  const diff = new Date(targetDate) - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
};

// Animated digit that flips when value changes
const AnimatedDigit = ({ value }) => {
  const prev = useRef(value);
  const changed = prev.current !== value;
  useEffect(() => {
    prev.current = value;
  });

  return (
    <div className="relative overflow-hidden h-10 lg:h-14 w-7 flex items-center justify-center">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={changed ? { y: "-100%", opacity: 0 } : false}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="absolute font-mono font-black text-xl lg:text-3xl text-gold leading-none"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};

const Unit = ({ label, value }) => {
  const digits = pad(value).split("");
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex items-center ">
        {digits.map((d, i) => (
          <AnimatedDigit key={i} value={d} />
        ))}
      </div>
      <span className="text-[8px] lg:text-[10px] uppercase tracking-widest text-cream font-semibold leading-none">
        {label}
      </span>
    </div>
  );
};

const Separator = () => (
  <span className="text-gold/40 font-black text-xl lg:text-2xl mb-3 select-none">
    :
  </span>
);

const CountDown = ({ startDate }) => {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(startDate));
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!startDate) return;
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(startDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [startDate]);

  if (!startDate || !timeLeft) return null;

  return (
    <motion.div
      initial={{ x: 120, opacity: 0 }}
      animate={{ x: collapsed ? "calc(100% - 0px)" : 0, opacity: 1 }}
      transition={{
        duration: 0.3,
        ease: [0.32, 0.72, 0, 1],
      }}
      className="fixed right-0 top-30 z-50"
    >
      <EdgeButtom
        collapsed={collapsed}
        onClick={() => setCollapsed((p) => !p)}
      />
      <div className="bg-black/50 border border-gold/30 border-r-0 px-3 pt-2 pb-3 flex flex-col items-center gap-2 shadow-2xl shadow-gold/10 backdrop-blur-md">
        <p className="text-[9px] lg:text-[10px] uppercase tracking-[0.2em] text-gold/70 font-bold leading-none">
          Get Ready In
        </p>
        <div className="flex items-end gap-3">
          <Unit label="Days" value={timeLeft.days} />
          <Separator />
          <Unit label="Hrs" value={timeLeft.hours} />
          <Separator />
          <Unit label="Min" value={timeLeft.minutes} />
          <Separator />
          <Unit label="Sec" value={timeLeft.seconds} />
        </div>
      </div>
    </motion.div>
  );
};

const EdgeButtom = ({ collapsed, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="absolute top-1/2 transform -translate-y-1/2 -left-3.5 text-black rounded-l-md w-5 h-15 bg-gold flex items-center justify-start cursor-pointer   duration-300"
    >
      {collapsed ? (
        <IoMdArrowDropleft size={16} className="absolute -left-0.5" />
      ) : (
        <IoMdArrowDropright size={16} />
      )}
    </div>
  );
};

export default CountDown;
