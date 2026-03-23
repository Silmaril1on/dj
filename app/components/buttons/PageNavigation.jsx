"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import MyLink from "@/app/components/ui/MyLink";
import Link from "next/link";

const PageNavigation = ({ linksData, className = " " }) => {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const pathname = usePathname();

  const handleMouseEnter = (index) => {
    if (linksData[index].hasDropdown) {
      setActiveDropdown(index);
    }
  };

  const handleMouseLeave = () => {
    setActiveDropdown(null);
  };

  const isActive = (href) => pathname === href;
  const isDropdownActive = (items) =>
    items.some((item) => pathname === item.href);

  return (
    <div className={`bg-stone-900 ${className}`}>
      <div className="max-w-6xl mx-auto">
        <nav className="flex relative">
          {linksData.map((item, index) => (
            <div
              key={item.href || item.text}
              className="relative"
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
            >
              {item.hasDropdown ? (
                <div
                  className={`py-2 px-3 h-full font-bold cursor-pointer flex items-center gap-1 ${
                    isDropdownActive(item.dropdownItems)
                      ? "bg-gold text-neutral-800"
                      : ""
                  }`}
                >
                  {item.icon}
                  <span className="text-xs lg:text-sm">{item.text}</span>
                  <span className="text-xs">▼</span>
                </div>
              ) : (
                <MyLink
                  href={item.href}
                  text={item.text}
                  icon={item.icon}
                  className={`py-2 px-4 center font-bold hover:bg-gold hover:text-neutral-800 ${
                    isActive(item.href) ? "bg-gold text-neutral-800" : ""
                  }`}
                />
              )}

              {/* Dropdown Menu */}
              <AnimatePresence>
                {item.hasDropdown && activeDropdown === index && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{
                      duration: 0.2,
                      ease: "easeOut",
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                    }}
                    className="absolute top-full left-0 bg-stone-900 w-full min-w-max z-50 overflow-hidden"
                  >
                    {item.dropdownItems.map((dropdownItem) => (
                      <div key={dropdownItem.href}>
                        <Link
                          href={dropdownItem.href}
                          onClick={() => setActiveDropdown(null)}
                          className={`py-2 px-4 font-bold text-sm gap-2 hover:bg-gold hover:text-neutral-800 duration-300 w-full flex text-start ${
                            isActive(dropdownItem.href)
                              ? "bg-gold text-neutral-800"
                              : "text-gold"
                          }`}
                        >
                          {dropdownItem.text}
                        </Link>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default PageNavigation;
