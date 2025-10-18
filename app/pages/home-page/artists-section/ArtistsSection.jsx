"use client";
import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "@/app/features/userSlice";
import SectionContainer from "@/app/components/containers/SectionContainer";
import Spinner from "@/app/components/ui/Spinner";
import SliderContainer from "@/app/components/containers/SliderContainer";
import ArtistCard from "./ArtistCard";
import Swiper from "@/app/components/containers/Swiper";

const ArtistsSection = () => {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = useSelector(selectUser);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    const fetchArtists = async () => {
      setLoading(true);
      setError(null);
      try {
        const query = user?.id ? `?userId=${encodeURIComponent(user.id)}` : "";
        const response = await fetch(`/api/artists${query}`, {
          cache: "no-store", 
        });
        if (!response.ok) {
          throw new Error("Failed to fetch artists");
        }
        const data = await response.json();
        setArtists(data.artists || []);
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
      description="Browse profiles, drop reviews, track and rate top talents."
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
                  animate={true}
                  delay={idx * 0.1} 
                />
              ))}
            </SliderContainer>
          </div>
          <Swiper animate={true} items={artists} />
        </>
      )}
    </SectionContainer>
  );
};

export default ArtistsSection;
