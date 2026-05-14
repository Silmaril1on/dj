import React from "react";
import { IoMdClose } from "react-icons/io";

const Close = ({ className, onClick, label = "Close" }) => {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`text-gold hover:rotate-90 duration-300 cursor-pointer ${className}`}
    >
      <IoMdClose />
    </button>
  );
};

export default Close;
