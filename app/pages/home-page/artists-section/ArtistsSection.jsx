"use client";
import { useEffect, useState, useRef } from "react";
import SectionContainer from "@/app/components/containers/SectionContainer";
import Spinner from "@/app/components/ui/Spinner";
import SliderContainer from "@/app/components/containers/SliderContainer";
import ArtistCard from "./ArtistCard";
import Swiper from "@/app/components/containers/Swiper";

const CACHE_KEY = "artists_section_cache";
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

const ArtistsSection = () => {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasFetched = useRef(false);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    // Check sessionStorage cache first
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) {
          setArtists(data);
          setLoading(false);
          return;
        }
      }
    } catch {
      // sessionStorage unavailable — proceed with fetch
    }

    const fetchArtists = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/artists`);
        if (!response.ok) {
          throw new Error("Failed to fetch artists");
        }
        const data = await response.json();
        const fetched = data.artists || [];
        setArtists(fetched);
        try {
          sessionStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ data: fetched, timestamp: Date.now() }),
          );
        } catch {
          // ignore storage errors
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchArtists();
  }, []);

  if (error) {
    return <h1>Error: {error}</h1>;
  }

  return (
    <SectionContainer
      title="Discover DJs & Artists"
      description="Browse profiles, drop reviews, track and rate performances"
    >
      {loading ? (
        <div className="center h-80 w-full">
          <Spinner />
        </div>
      ) : (
        <>
          <div className="hidden lg:block">
            <SliderContainer
              items={artists}
              animate={true}
              cardWidth={236}
              itemsPerPage={6}
            >
              {artists?.map((artist, idx) => (
                <ArtistCard
                  key={artist.id}
                  artist={artist}
                  animate={idx < 6 && !hasAnimated.current}
                  delay={idx * 0.1}
                  onAnimationComplete={() => {
                    if (idx === 5) {
                      hasAnimated.current = true;
                    }
                  }}
                />
              ))}
            </SliderContainer>
          </div>
          <Swiper animate={true} cardWidth={310} spacing={12}>
            {artists?.map((artist) => (
              <ArtistCard
                key={artist.id}
                artist={artist}
                cardMargin={0}
                cardWidth={310}
                animate={false}
              />
            ))}
          </Swiper>
        </>
      )}
    </SectionContainer>
  );
};

export default ArtistsSection;
