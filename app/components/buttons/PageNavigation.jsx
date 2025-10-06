'use client'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import MyLink from '@/app/components/ui/MyLink'

const PageNavigation = ({ linksData, className = " " }) => {
  const [activeDropdown, setActiveDropdown] = useState(null)

  const handleMouseEnter = (index) => {
    if (linksData[index].hasDropdown) {
      setActiveDropdown(index)
    }
  }

  const handleMouseLeave = () => {
    setActiveDropdown(null)
  }



  return (
    <div className={`bg-stone-900 ${className}`}>
      <div className="max-w-6xl mx-auto px-4">
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
                  className="py-2 px-4 font-bold  cursor-pointer flex items-center gap-1">
                  {item.icon}
                  <span>{item.text}</span>
                  <span className="text-xs">▼</span>
                </div>
              ) : (
                <MyLink
                  href={item.href}
                  text={item.text}
                  icon={item.icon}
                  className='py-2 px-4 center font-bold hover:bg-gold hover:text-neutral-800'
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
                      damping: 30
                    }}
                    className="absolute top-full left-0 bg-stone-800 w-full z-50 overflow-hidden"
                  >
                    {item.dropdownItems.map((dropdownItem) => (
                      <div key={dropdownItem.href}>
                        <MyLink
                          href={dropdownItem.href}
                          text={dropdownItem.text}
                          icon={dropdownItem.icon}
                          className="py-3 px-4 font-bold  text-sm text-gold gap-2 hover:bg-gold hover:text-neutral-800 duration-300 w-full flex items-center "
                        />
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
  )
}

export default PageNavigation