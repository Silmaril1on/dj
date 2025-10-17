export const fadeIn = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.4,
      staggerChildren: 0.2,
      delayChildren: 0.1,
      ease: "easeInOut",
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.4,
      staggerChildren: 0.2,
      delayChildren: 0.1,
      ease: "easeInOut",
    },
  },
};

export const slideLeft = {
  hidden: {
    x: "-100%",
  },
  visible: {
    x: 0,
    transition: {
      duration: 0.3,
      staggerChildren: 0.2,
      delayChildren: 0.1,
      ease: "easeInOut",
    },
  },
  exit: {
    x: -100,
    transition: {
      duration: 0.3,
      staggerChildren: 0.2,
      delayChildren: 0.1,
      ease: "easeInOut",
    },
  },
};

export const popup = {
  hidden: {
    opacity: 0,
    y: -10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      staggerChildren: 0.2,
      delayChildren: 0.1,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.3,
      staggerChildren: 0.2,
      delayChildren: 0.1,
      ease: "easeIn",
    },
  },
};

export const slideTop = {
  hidden: {
    y: "100%",
  },
  visible: {
    y: 0,
    transition: {
      duration: 0.3,
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
  exit: {
    y: -100,
    transition: {
      duration: 0.3,
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
};

export const slideBottom = {
  hidden: {
    y: " -100%",
  },
  visible: {
    y: 0,
    transition: {
      duration: 0.3,
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
  exit: {
    y: "-100%",
    transition: {
      duration: 0.3,
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
};
