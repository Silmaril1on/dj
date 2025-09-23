"use client"
import { AnimatePresence, motion } from 'framer-motion';
import { popup } from '@/app/framer-motion/motionValues';

const PopUpBox = ({
    isOpen,
    className = "",
    text,
    children,
    animationVariant = popup,
    ...props
}) => {

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    variants={animationVariant}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className={className}
                    {...props}
                >
                    {text && <span>{text}</span>}
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PopUpBox;