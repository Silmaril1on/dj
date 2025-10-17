"use client"
import React, { useState } from 'react'
import { FaBars } from 'react-icons/fa'
import SideBar from './SideBar';

const BurgerMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  return (
    <>
      <button 
        onClick={toggleSidebar}
        className="block w-fit lg:hidden text-cream hover:text-gold duration-300 text-xl cursor-pointer"
      >
        <FaBars />
      </button>
      <SideBar isOpen={isOpen} onClose={closeSidebar} />
    </>
  );
}

export default BurgerMenu