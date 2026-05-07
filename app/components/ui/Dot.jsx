import React from "react";

const Dot = ({ className }) => {
  return (
    <span
      className={`text-gold text-xs lg:text-xl center w-fit h-3 ${className}`}
    >
      •
    </span>
  );
};

export default Dot;
