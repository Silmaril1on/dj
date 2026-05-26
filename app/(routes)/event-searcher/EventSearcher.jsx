"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MdSearch, MdPublic } from "react-icons/md";
import EnhancedSearch from "./enhanced-search/EnhancedSearch";
import Globe from "./global-search/Globe";

const modes = [
  {
    id: "enhanced",
    icon: MdSearch,
    label: "Artist Search",
    description: "Find events featuring specific artists together",
    component: <EnhancedSearch />,
  },
  {
    id: "globe",
    icon: MdPublic,
    label: "Global Search",
    description: "Spin the world & Explore events around the world",
    component: <Globe />,
  },
];

const EventSearcher = () => {
  const [activeMode, setActiveMode] = useState(null);

  return (
    <div className="w-full min-h-screen space-y-12 py-10 px-4">
      {/* ── Mode Selection Buttons ── */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
        {modes.map((mode, idx) => {
          const Icon = mode.icon;
          const isActive = activeMode === mode.id;
          const initialX = idx === 0 ? -50 : 50;
          return (
            <motion.button
              key={mode.id}
              initial={{
                y: 50,
                opacity: 0,
                x: initialX,
                scale: 0.8,
                opacity: 0,
              }}
              animate={{ y: 0, opacity: 1, x: 0, scale: 1, opacity: 1 }}
              transition={{
                duration: 0.55,
                delay: idx * 0.1,
                type: "spring",
                bounce: 0.1,
              }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveMode(isActive ? null : mode.id)}
              className={`w-64 h-64 flex flex-col items-center justify-center gap-4 border-2 transition-all duration-300 cursor-pointer ${
                isActive
                  ? "bg-gold/15 border-gold text-gold"
                  : "bg-stone-900 border-chino/30 text-cream/90 hover:border-gold/50 hover:text-gold hover:bg-stone-900/70"
              }`}
            >
              <Icon size={52} className={isActive ? "text-gold" : undefined} />
              <div className="text-center space-y-1 px-4">
                <p className="font-bold text-base uppercase tracking-wider">
                  {mode.label}
                </p>
                <p className="text-xs text-cream/70 secondary leading-snug">
                  {mode.description}
                </p>
              </div>
              <div>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="w-8 h-1 bg-gold"
                  />
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* ── Active Component ── */}
      <AnimatePresence mode="wait">
        {activeMode && (
          <motion.div
            key={activeMode}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
          >
            {modes.find((m) => m.id === activeMode)?.component}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EventSearcher;
