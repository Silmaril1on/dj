"use client";
import { useAnimate } from "framer-motion";
import { useMemo } from "react";

export const NO_CLIP = "polygon(0 0, 100% 0, 0 0, 0% 100%)";
export const MAIN_CLIP = "polygon(100% 100%, 100% 0, 0 0, 0% 100%)";

export function useHover({ from = NO_CLIP, to = MAIN_CLIP, options } = {}) {
  const [scope, animate] = useAnimate();

  const handlers = useMemo(
    () => ({
      onMouseEnter() {
        animate(scope.current, { clipPath: [from, to] }, options);
      },
      onMouseLeave() {
        animate(scope.current, { clipPath: [to, from] }, options);
      },
    }),
    [animate, scope, from, to, options]
  );

  return {
    overlayRef: scope,
    initialClipPath: from,
    ...handlers,
  };
}
