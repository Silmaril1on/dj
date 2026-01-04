import React from "react";

const Dot = ({ className }) => {
  return (
    <span className={`text-gold text-xs lg:text-xl w-fit ${className}`}>•</span>
  );
};

export default Dot;
