import { useState, useCallback } from "react";

const useHover = (delay = 0) => {
  const [isHovered, setIsHovered] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);

  const handleMouseEnter = useCallback(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsHovered(true);
  }, [timeoutId]);

  const handleMouseLeave = useCallback(() => {
    if (delay > 0) {
      const id = setTimeout(() => setIsHovered(false), delay);
      setTimeoutId(id);
    } else {
      setIsHovered(false);
    }
  }, [delay]);

  const closeHover = useCallback(() => {
    setIsHovered(false);
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
  }, [timeoutId]);

  const hoverProps = {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
  };

  return [isHovered, hoverProps, closeHover];
};

export default useHover;
