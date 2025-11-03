'use client'
import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { IoShareSocialOutline } from "react-icons/io5";
import { FaFacebook } from "react-icons/fa";
import { FaXTwitter, FaRegCopy } from "react-icons/fa6";

const ShareButton = ({ className, artistName = "this artist" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const getCurrentUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    return '';
  };

  const handleCopyLink = async () => {
    const url = getCurrentUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setIsOpen(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShareFacebook = () => {
    const url = getCurrentUrl();
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
    setIsOpen(false);
  };

  const handleShareTwitter = () => {
    const url = getCurrentUrl();
    const text = `Check out ${artistName} on Soundfolio!`;
    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`${className} text-gold z-20 bg-gold/20 hover:bg-gold/30 duration-300 cursor-pointer rounded-full p-2`}
      >
        <IoShareSocialOutline className='pr-0.5' />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="absolute top-12 left-0 bg-stone-900 border-2 border-gold/30 shadow-xl z-50 min-w-[200px]"
          >
            <div className='*:cursor-pointer'>
              {/* Facebook Share */}
              <button
                onClick={handleShareFacebook}
                className="w-full px-4 py-2.5 text-left text-gold hover:bg-gold/20 duration-200 flex items-center gap-3"
              >
                <FaFacebook className="text-lg" />
                <span className="text-sm">Share on Facebook</span>
              </button>

              {/* Twitter/X Share */}
              <button
                onClick={handleShareTwitter}
                className="w-full px-4 py-2.5 text-left text-gold hover:bg-gold/20 duration-200 flex items-center gap-3 border-t border-gold/10"
              >
                <FaXTwitter className="text-lg" />
                <span className="text-sm">Share on X</span>
              </button>

              {/* Copy Link */}
              <button
                onClick={handleCopyLink}
                className="w-full px-4 py-2.5 text-left text-gold hover:bg-gold/20 duration-200 flex items-center gap-3 border-t border-gold/10"
              >
                <FaRegCopy className="text-lg" />
                <span className="text-sm">
                  {copied ? 'Link Copied!' : 'Copy Link'}
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ShareButton