"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

const Twinkles = ({
  className = "absolute z-0 inset-0",
  id = "tsparticles",
}) => {
  const [init, setInit] = useState(false);
  const options = useMemo(
    () => ({
      fullScreen: { enable: false, zIndex: 0 },
      background: { color: { value: "transparent" } },
      particles: {
        size: {
          value: { min: 0.7, max: 1.3 },
          animation: {
            enable: true,
            speed: 2,
            minimumValue: 1,
            sync: false,
          },
        },
        number: { value: 250 },
        color: { value: "#fcf5df" },
        shape: { type: "star" },
        opacity: {
          value: { min: 0.1, max: 0.8 },
          animation: {
            enable: true,
            speed: 0.4,
            minimumValue: 0.3,
            sync: false,
          },
        },
        move: {
          enable: true,
          speed: 0.3,
          direction: "none",
          random: true,
          straight: false,
          outModes: { default: "out" },
        },
      },
      interactivity: {
        events: {
          onHover: { enable: false, mode: "repulse" },
          onClick: { enable: false, mode: "push" },
        },
        modes: {
          repulse: { distance: 100 },
          push: { quantity: 2 },
        },
      },
      detectRetina: true,
    }),
    [],
  );

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const particlesLoaded = useCallback(() => {}, []);

  return (
    <>
      {init && (
        <Particles
          id={id}
          className={className}
          particlesLoaded={particlesLoaded}
          options={options}
        />
      )}
    </>
  );
};

export default memo(Twinkles);
