"use client";
import { motion } from "framer-motion";

const LayoutButtons = ({
  options = [],
  activeOption,
  onOptionChange,
  color, 
  className = "",
  buttonClassName = "",
  layoutId = "activeLayout", // Make layoutId configurable with a default
}) => {
  return (
    <div className={`flex ${className}`}>
      <div className="relative flex bg-neutral bg-gold p-1">
        {options.map((option) => {
          const isActive = activeOption === option.value;
          const Icon = option.icon;
          return (
            <button
              key={option.value}
              onClick={() => onOptionChange(option.value)}
              className={`relative px-4 py-1 uppercase rounded-full text-xs font-medium cursor-pointer z-10 ${
                isActive
                  ? "text-cream"
                  : "text-stone-900"
              } ${buttonClassName}`}
            >
              {isActive && (
                <motion.span
                  layoutId={layoutId}
                  className={`absolute inset-0 ${color}  -z-10`}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              {Icon ? <Icon size={18} /> : option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LayoutButtons;
