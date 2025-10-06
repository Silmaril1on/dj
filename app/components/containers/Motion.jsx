"use client"
import { motion } from "framer-motion";
const { slideLeft, fadeIn, popup, slideTop } = require("../../framer-motion/motionValues");

const Motion = ({
    children,
    className = "",
    animation,
    stagger = false,
    delay = 0,
    onClick,
    onMouseEnter,
    onMouseLeave,
    initial = "hidden",
    animate = "visible",
    exit = "exit",
    ...props
}) => {
    const motionVariants = {
        left: "slideLeft",
        fade: "fadeIn",
        pop: "popup",
        top: "slideTop"
    };

    const getAnimationVariant = () => {
        if (!animation) return null;
        const variantName = motionVariants[animation];
        if (!variantName) return null;
        return { slideLeft, fadeIn, popup, slideTop }[variantName];
    };

    const getChildVariants = (animationType) => {
        const baseVariant = getAnimationVariant();
        if (!baseVariant) return null;
        return {
            hidden: baseVariant.hidden,
            visible: {
                ...baseVariant.visible,
                transition: {
                    ...baseVariant.visible.transition,
                    staggerChildren: undefined,
                    delayChildren: undefined,
                }
            },
            exit: {
                ...baseVariant.exit,
                transition: {
                    ...baseVariant.exit.transition,
                    staggerChildren: undefined,
                    delayChildren: undefined,
                }
            }
        };
    };

    const animationVariantBase = getAnimationVariant();
    const animationVariant = animationVariantBase
        ? {
            hidden: { ...animationVariantBase.hidden },
            visible: {
                ...animationVariantBase.visible,
                transition: {
                    ...animationVariantBase.visible?.transition,
                    delay: (animationVariantBase.visible?.transition?.delay || 0) + delay,
                },
            },
            exit: animationVariantBase.exit
                ? {
                    ...animationVariantBase.exit,
                    transition: {
                        ...animationVariantBase.exit?.transition,
                        delay: (animationVariantBase.exit?.transition?.delay || 0) + delay,
                    },
                }
                : undefined,
        }
        : null;
    const childVariants = getChildVariants(animation);
    const isMotion = !!animationVariant;

    if (isMotion) {
        if (stagger) {
            return (
                <motion.div
                    variants={animationVariant}
                    initial={initial}
                    whileInView={animate}
                    exit={exit}
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
                    onClick={onClick}
                    className={className}
                    viewport={{ once: true }}
                    {...props}
                >
                    {Array.isArray(children) ?
                        children.map((child, index) => (
                            <motion.div key={index} variants={childVariants}>
                                {child}
                            </motion.div>
                        )) :
                        <motion.div variants={childVariants}>
                            {children}
                        </motion.div>
                    }
                </motion.div>
            );
        } else {
            return (
                <motion.div
                    variants={animationVariant}
                    initial={initial}
                    whileInView={animate}
                    exit={exit}
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
                    onClick={onClick}
                    className={className}
                    viewport={{ once: true }}
                    {...props}
                >
                    {children}
                </motion.div>
            );
        }
    }

    // Fallback to regular div if no animation
    return (
        <div
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onClick={onClick}
            className={className}
            {...props}
        >
            {children}
        </div>
    );
};

export default Motion;