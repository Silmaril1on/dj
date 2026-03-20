import React from "react";
import { IoMdClose } from "react-icons/io";

const Close = ({ className, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`text-gold hover:rotate-90 duration-300 cursor-pointer ${className}`}
    >
      <IoMdClose />
    </button>
  );
};

export default Close;
