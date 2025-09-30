"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { slideTop } from "@/app/framer-motion/motionValues";
import Title from "@/app/components/ui/Title";
import Paragraph from "@/app/components/ui/Paragraph";
import Spinner from "@/app/components/ui/Spinner";
import ArtistName from "@/app/components/materials/ArtistName";
import SectionContainer from "@/app/components/containers/SectionContainer";
import SliderContainer from "@/app/components/containers/SliderContainer";
import { fakeBornData } from "@/app/localDB/fakeBornData";

const BornToday = () => {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchArtistsBornToday();
  }, []);

  const fetchArtistsBornToday = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/artists/born-today");
      const data = await response.json();

      if (response.ok) {
        setArtists(data.data || []);
      } else {
        setError(data.error || "Failed to fetch artists");
      }
    } catch (err) {
      setError("Network error while fetching artists");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gold/10 border border-gold/30 rounded-lg p-6">
        <Title text="Born Today" size="lg" className="mb-4" />
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gold/10 border border-gold/30 rounded-lg p-6">
        <Title text="Born Today" size="lg" className="mb-4" />
        <Paragraph text={`Error: ${error}`} className="text-red-500" />
      </div>
    );
  }

  const artistList = artists && artists.length > 0 ? artists : fakeBornData;

  return (
    <SectionContainer
      title="Born Today"
      description="Discover artists celebrating their birthday today."
    >
      <SliderContainer items={artistList} itemsPerPage={5} cardWidth={280}>
        {artistList.map((artist) => (
          <div
            key={artist.id}
            className="group cursor-pointer"
            style={{ minWidth: 280, margin: "0 8px" }}
          >
            <Link href={`/artists/${artist.id}`}>
              <div className="bg-stone-900 bordered p-2 transition-colors duration-300">
                <div className="relative w-full h-52 mb-3 overflow-hidden">
                  <Image
                    src={artist.artist_image}
                    alt={artist.stage_name || artist.name}
                    width={300}
                    height={300}
                    className="object-cover brightness w-full h-full"
                  />
                </div>
                <div className="text-center">
                  <ArtistName artistName={artist} />
                  <p className="text-cream text-xs secondary font-light">
                    Turns {artist.age} today
                  </p>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </SliderContainer>
    </SectionContainer>
  );
};

export default BornToday;



