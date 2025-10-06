"use client";
import Motion from '@/app/components/containers/Motion';
import Paragraph from '@/app/components/ui/Paragraph';
import Title from '@/app/components/ui/Title';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { FaMusic, FaCalendarAlt, FaNewspaper, FaBuilding } from 'react-icons/fa';

const AppDataStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/app-data-stats');
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch stats');
        }
        
        setStats(data.stats);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statItems = [
    {
      key: 'artists',
      label: 'Artists',
      link: "/artists"
    },
    {
      key: 'events',
      label: 'Events',
      link: "/events"
    },
    {
      key: 'clubs',
      label: 'Clubs',
      link: "/clubs"
    },
    {
      key: 'news',
      label: 'News',
      link: "/news"
    }
  ];

  if (loading) return <div className="text-center text-gold">Loading stats...</div>;
  if (error) return <div className="text-center text-red-400">Error: {error}</div>;

  return (
    <div className="w-full px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-2">
      <div className="grid grid-cols-1 md:grid-cols-2 h-80 gap-2">
        {statItems.map((item, index) => (
          <Motion
            animation="fade"
            delay={index * 0.03}
            key={item.key}
            className="bg-gold/40 p-6 text-center hover:bg-gold/30 duration-300 group"
          >
            <Link href={item.link}>
              <div className="grid grid-cols-2">
                <div className="text-gold font-bold text-4xl">{item.label}</div>
                <div className="text-8xl text-cream font-bold group-hover:scale-120 group-hover:rotate-[10deg] duration-300">
                  {stats?.[item.key] || 0}
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
          text="Your Gateway to the Global Rave Network"
        />
        <Paragraph
          text="Explore a living database of artists, events, clubs, and news powered
          by collective effort. Every contribution counts — from adding new
          talent, to sharing event info, to reporting updates. "
        />
        <Paragraph
          className="mt-2"
          text="Together we
          create a space where the community connects, collaborates, and
          celebrates electronic music culture. This platform exists thanks to the community. Your input helps the scene evolve, keeps the culture alive, and ensures that everyone can stay connected to what matters.
Together we create a space where the rave community thrives, collaborates, and celebrates electronic music culture."
        />
      </Motion>
    </div>
  );
};

export default AppDataStats;