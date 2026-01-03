"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import SectionContainer from "@/app/components/containers/SectionContainer";
import Title from "@/app/components/ui/Title";
import Paragraph from "@/app/components/ui/Paragraph";
import SpanText from "@/app/components/ui/SpanText";
import { truncateString } from "@/app/helpers/utils";

const Albums = ({ artistId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/artists/${artistId}/albums?limit=15`
        );
        const result = await response.json();

        if (result.success) {
          setData(result.data || []);
          setHasMore(result.hasMore || false);
          // Set the first album as selected by default
          if (result.data && result.data.length > 0) {
            setSelectedAlbum(result.data[0]);
          }
        } else {
          setError(result.error);
        }
      } catch (err) {
        console.error("Error fetching albums:", err);
        setError("Failed to load albums");
      } finally {
        setLoading(false);
      }
    };

    if (artistId) {
      fetchAlbums();
    }
  }, [artistId]);

  if (loading) {
    return (
      <SectionContainer
        title="Albums & Releases"
        description="Discography and music releases"
        className="bg-stone-900 min-h-[300px]"
      >
        <div className="flex items-center justify-center py-10">
          <div className="animate-pulse text-gold">Loading albums...</div>
        </div>
      </SectionContainer>
    );
  }

  if (error || !data || data.length === 0) {
    return null;
  }

  return (
    <SectionContainer
      title="Albums & Releases"
      description="Discography and music releases"
      className="bg-stone-900 relative"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full lg:px-[5%]">
        {/* Left side: Album images */}
        <div className="space-y-4">
          <div
            className={`grid grid-cols-2 md:grid-cols-3 gap-3 w-full ${
              data.length >= 10 ? "lg:grid-cols-5" : "lg:grid-cols-4"
            }`}
          >
            {data.map((album, index) => (
              <motion.div
                key={album.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                onClick={() => setSelectedAlbum(album)}
                className={`relative aspect-square bg-black duration-300 cursor-pointer ${
                  selectedAlbum?.id === album.id
                    ? "border-3 border-gold"
                    : "opacity-50 brightness-70 hover:brightness-100"
                }`}
              >
                <div className="absolute inset-0 z-0">
                  <Image
                    src={album.album_image}
                    alt={album.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </motion.div>
            ))}
          </div>

          {hasMore && (
            <div className="w-full text-center">
              <h1 className="text-gold font-bold text-xl uppercase cursor-pointer hover:text-gold/80 transition-colors">
                View ALL
              </h1>
            </div>
          )}
        </div>

        {/* Right side: Album tracklist */}
        <AlbumInfo album={selectedAlbum} />
      </div>
    </SectionContainer>
  );
};

const AlbumInfo = ({ album }) => {
  if (!album) {
    return (
      <div className="bg-black border border-gold/30 p-6 flex items-center justify-center">
        <Paragraph text="Select an album to view details" color="chino" />
      </div>
    );
  }

  return (
    <motion.div
      key={album.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-black border-2 border-gold/50 p-4 space-y-4 max-h-[390px] overflow-y-auto"
    >
      {/* Album Name */}
      <div>
        <Title text={album.name} size="lg" color="gold" className="uppercase" />
        {album.release_date && (
          <Paragraph
            text={new Date(album.release_date).toLocaleDateString()}
            className="text-chino/80 text-sm mt-1"
          />
        )}
      </div>

      {/* Description */}
      {album.description && (
        <div>
          <SpanText
            size="xs"
            font="secondary"
            color="cream"
            text={album.description}
          />
        </div>
      )}

      {/* Tracklist */}
      {album.tracklist && album.tracklist.length > 0 && (
        <div>
          <h4 className="text-black bg-gold px-3 w-fit text-sm font-bold uppercase mb-3">
            Tracklist ({album.tracklist.length} tracks)
          </h4>
          <ul
            className={`space-y-1 overflow-y-auto custom-scrollbar ${
              album.tracklist.length > 10 ? "grid grid-cols-2 gap-x-4" : ""
            }`}
          >
            {album.tracklist.map((track, idx) => (
              <li
                key={idx}
                className="text-chino secondary text-[10px] flex items-start pointer-events-none"
              >
                <span className=" text-gold/70 font-bold min-w-[24px]">
                  {idx + 1}.
                </span>
                {/* <span>{track}</span> */}
                <span>{truncateString(track, 38)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
};

export default Albums;
