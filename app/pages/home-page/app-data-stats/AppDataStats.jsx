"use client";

import Motion from "@/app/components/containers/Motion";
import Paragraph from "@/app/components/ui/Paragraph";
import Title from "@/app/components/ui/Title";
import Link from "next/link";
import React, { useEffect, useState } from "react";

const statItems = [
  { key: "artists", label: "Artists", link: "/artists" },
  { key: "events", label: "Events", link: "/events" },
  { key: "clubs", label: "Clubs", link: "/clubs" },
  { key: "news", label: "News", link: "/news" },
];

const AppDataStats = () => {
  const [stats, setStats] = useState({
    artists: 0,
    events: 0,
    clubs: 0,
    news: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchStats = async () => {
      try {
        const response = await fetch("/api/admin/app-data-stats", {
          signal: controller.signal,
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch stats");
        }

        setStats(data.stats);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchStats();

    return () => controller.abort();
  }, []);

  return (
    <div className="w-full px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-2">
      <div className="grid grid-cols-2 h-80 gap-2">
        {statItems.map((item) => (
          <Motion
            animation="fade"
            key={item.key}
            className="bg-gold/40 hover:bg-gold/30 duration-300 group relative overflow-hidden"
          >
            <Link href={item.link} className="block h-full w-full p-6">
              <div className="relative h-full">
                <div className="text-gold font-bold text-3xl lg:text-4xl">
                  {item.label}
                </div>

                <div className="absolute bottom-5 right-5 text-5xl lg:text-8xl text-cream font-bold transition-transform duration-300 group-hover:scale-[1.2] group-hover:rotate-[10deg]">
                  {loading ? "..." : (stats?.[item.key] ?? 0)}
                </div>
              </div>
            </Link>
          </Motion>
        ))}
      </div>

      <Motion
        animation="top"
        delay={0.05}
        className="flex flex-col justify-center bg-stone-900 p-8 shadow-md"
      >
        <Title
          size="lg"
          color="cream"
          className="leading-none"
          text="Your Gateway to the Global Rave Network"
        />

        {error ? (
          <Paragraph text={`Could not load stats: ${error}`} />
        ) : (
          <>
            <Paragraph text="Explore a living database of artists, events, clubs, and news powered by collective effort. Every contribution counts — from adding new talent, to sharing event info, to reporting updates." />

            <Paragraph
              className="mt-2"
              text="Together we create a space where the community connects, collaborates, and celebrates electronic music culture. This platform exists thanks to the community. Your input helps the scene evolve, keeps the culture alive, and ensures that everyone can stay connected to what matters."
            />
          </>
        )}
      </Motion>
    </div>
  );
};

export default AppDataStats;
