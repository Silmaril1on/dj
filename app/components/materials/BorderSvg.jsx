"use client";
import React, { useId, useState, useEffect } from "react";

const BORDER_COLORS = {
  yellow: [
    "rgba(234, 179, 8, 0.95)",
    "rgba(234, 179, 8, 0.5)",
    "rgba(234, 179, 8, 0)",
    "rgba(234, 179, 8, 0.55)",
    "rgba(234, 179, 8, 0.2)",
  ],

  gold: [
    "rgba(252, 185, 19, 0.95)",
    "rgba(252, 185, 19, 0.5)",
    "rgba(252, 185, 19, 0)",
    "rgba(252, 185, 19, 0.55)",
    "rgba(252, 185, 19, 0.2)",
  ],
  blue: [
    "rgba(9, 87, 195, 0.95)",
    "rgba(9, 87, 195, 0.5)",
    "rgba(9, 87, 195, 0)",
    "rgba(9, 87, 195, 0.55)",
    "rgba(9, 87, 195, 0.2)",
  ],

  grey: [
    "rgba(122, 143, 160, 0.95)",
    "rgba(122, 143, 160, 0.5)",
    "rgba(122, 143, 160, 0)",
    "rgba(122, 143, 160, 0.55)",
    "rgba(122, 143, 160, 0.2)",
  ],
};

const BorderSvg = ({
  className = "",
  radius = 8,
  strokeWidth = 1.4,
  fadeAt = null,
  color,
}) => {
  const [themeKey, setThemeKey] = useState("teal");

  useEffect(() => {
    const update = () =>
      setThemeKey(
        document.documentElement.getAttribute("data-theme") ?? "teal",
      );
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  const resolvedColor = color ?? themeKey;
  const id = useId().replace(/:/g, "");
  const gradientId = `gradient-${id}`;
  const [c0, c1, c2, c3, c4] =
    BORDER_COLORS[resolvedColor] ?? BORDER_COLORS.teal;

  return (
    <svg
      width="100%"
      height="100%"
      className={`absolute z-0 inset-0 pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <rect
        stroke={`url(#${gradientId})`}
        fill="none"
        x={strokeWidth / 2}
        y={strokeWidth / 2}
        width={`calc(100% - ${strokeWidth}px)`}
        height={`calc(100% - ${strokeWidth}px)`}
        strokeWidth={strokeWidth}
        rx={radius}
      />
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={c0} />
          {fadeAt !== null ? (
            <>
              <stop offset={`${fadeAt}%`} stopColor={c1} />
              <stop offset={`${fadeAt + 20}%`} stopColor={c2} />
              <stop offset="100%" stopColor={c2} />
            </>
          ) : (
            <>
              <stop offset="45%" stopColor={c3} />
              <stop offset="100%" stopColor={c4} />
            </>
          )}
        </linearGradient>
      </defs>
    </svg>
  );
};

export default BorderSvg;
