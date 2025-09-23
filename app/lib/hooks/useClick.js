import { useState, useCallback, useEffect, useRef } from "react";

const useClick = (initialState = false) => {
  const [isClicked, setIsClicked] = useState(initialState);
  const ref = useRef(null);

  const toggleClick = useCallback(() => {
    setIsClicked((prev) => !prev);
  }, []);

  const openClick = useCallback(() => {
    setIsClicked(true);
  }, []);

  const closeClick = useCallback(() => {
    setIsClicked(false);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsClicked(false);
      }
    };

    if (isClicked) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isClicked]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsClicked(false);
      }
    };

    if (isClicked) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isClicked]);

  return [isClicked, { toggleClick, openClick, closeClick }, ref];
};

export default useClick;
