"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import SectionContainer from "@/app/components/containers/SectionContainer";
import ArtistCountry from "@/app/components/materials/ArtistCountry";
import Motion from "@/app/components/containers/Motion";

const RelatedArtists = ({ artistId, genres }) => {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!artistId || !genres?.length) {
      setLoading(false);
      return;
    }

    const params = new URLSearchParams({
      artistId,
      genres: genres.join(","),
    });

    fetch(`/api/artists/get-related-artists?${params}`)
      .then((r) => r.json())
      .then((data) => setArtists(data.artists || []))
      .catch(() => setArtists([]))
      .finally(() => setLoading(false));
  }, [artistId, genres]);

  if (loading) {
    return (
      <SectionContainer
        title="Related Artists"
        description="Artists with similar genres"
      >
        <div className="grid grid-cols-4 lg:grid-cols-8 gap-2 px-2 lg:px-4 pb-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1">
              <div className="aspect-square bg-stone-800 animate-pulse" />
              <div className="h-3 bg-stone-800 animate-pulse rounded w-3/4" />
              <div className="h-2 bg-stone-800 animate-pulse rounded w-1/2" />
            </div>
          ))}
        </div>
      </SectionContainer>
    );
  }

  if (!artists.length) return null;

  return (
    <SectionContainer
      title="Related Artists"
      description="Artists with similar genres you might enjoy"
    >
      <div className="grid grid-cols-4 lg:w-[60%] gap-4 lg:gap-8 px-2 lg:px-4">
        {artists.map((artist, i) => (
          <Motion key={artist.id} animation="top" delay={i * 0.05}>
            <Link
              href={`/artists/${artist.artist_slug}`}
              className="flex flex-col gap-1 opacity-80 hover:opacity-100 duration-300"
            >
              <div className="relative aspect-square overflow-hidden rounded-full">
                <Image
                  src={artist.artist_image}
                  alt={artist.stage_name || artist.name}
                  fill
                  sizes="(max-width: 640px) 25vw, 12vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="center flex-col">
                <p className="text-cream font-bold text-xs lg:text-lg uppercase leading-none truncate">
                  {artist.stage_name || artist.name}
                </p>
                <ArtistCountry
                  artistCountry={{ country: artist.country }}
                  size="small"
                />
              </div>
            </Link>
          </Motion>
        ))}
      </div>
    </SectionContainer>
  );
};

export default RelatedArtists;
