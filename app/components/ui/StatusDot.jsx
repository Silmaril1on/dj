"use client" 
import { motion } from "framer-motion"

const StatusDot = ({ hasUnread }) => {
  return (
    <>
      {hasUnread && (
        <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-cream cursor-pointer">
          <motion.div
            className=" w-full h-full rounded-full bg-cream"
            initial={{ scale: 1, opacity: 0 }}
            animate={{ scale: [1, 2, 1], opacity: [0.6] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeIn",
            }}
          />
        </div>
      )}
    </>
  );
}

export default StatusDot