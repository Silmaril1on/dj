"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoShareSocialOutline } from "react-icons/io5";
import { FaFacebook } from "react-icons/fa";
import { FaXTwitter, FaRegCopy } from "react-icons/fa6";
import ActionButton from "@/app/components/buttons/ActionButton";

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
    if (typeof window !== "undefined") {
      return window.location.href;
    }
    return "";
  };

  const handleShare = (type) => {
    const url = getCurrentUrl();

    if (type === "copy") {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
          setIsOpen(false);
        }, 2000);
      });
      return;
    }

    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`Check out ${artistName} on Soundfolio!`)}`,
    };

    window.open(shareUrls[type], "_blank", "width=600,height=400");
    setIsOpen(false);
  };

  const shareOptions = [
    {
      type: "facebook",
      icon: <FaFacebook className="text-lg" />,
      label: "Share on Facebook",
    },
    {
      type: "twitter",
      icon: <FaXTwitter className="text-lg" />,
      label: "Share on X",
    },
    {
      type: "copy",
      icon: <FaRegCopy className="text-lg" />,
      label: copied ? "Link Copied!" : "Copy Link",
    },
  ];

  return (
    <div ref={dropdownRef} className="relative">
      <ActionButton
        icon={<IoShareSocialOutline size={20} />}
        onClick={() => setIsOpen(!isOpen)}
        requireAuth={false}
        className={className}
      />
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="absolute top-12 left-0 bg-stone-900 border-2 border-gold/30 shadow-xl z-50 min-w-[200px]"
          >
            <div className="*:cursor-pointer">
              {shareOptions.map(({ type, icon, label }, i) => (
                <button
                  key={type}
                  onClick={() => handleShare(type)}
                  className={`w-full px-4 py-2.5 text-left text-gold hover:bg-gold/20 duration-200 flex items-center gap-3 ${i > 0 ? "border-t border-gold/10" : ""}`}
                >
                  {icon}
                  <span className="text-sm">{label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShareButton;
