import React from 'react'
import Image from 'next/image'

const AbsoluteLogo = ({ 
  x = "left-1/2 -translate-x-1/2", 
  y = "top-1/2 -translate-y-1/2", 
  size = "lg",
  opacity = "opacity-10",
  blur = "blur-xs",
  rotate = "rotate-45",
  scale = "scale-200"
}) => {
  // Size mapping
  const sizeClasses = {
    sm: "w-20 h-20",
    md: "w-48 h-48", 
    lg: "w-64 h-64"
  }

  const sizeClass = sizeClasses[size] || sizeClasses.lg

  return (
    <div className={`${sizeClass} overflow-hidden z-0 ${opacity} ${blur} absolute ${y} ${x} transform sepia ${rotate}`}>
      <Image
        src="/assets/elivagar-logo.png"
        className={`w-full h-full object-contain ${scale}`}
        alt="Elivagar Logo"
        width={128}
        height={128}
      />
    </div>
  )
}

export default AbsoluteLogo