"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { FaHouse } from "react-icons/fa6";
import Avatar from "@/app/pages/artist/artist-profile/hero/Avatar";
import ArtistCountry from "@/app/components/materials/ArtistCountry";
import ArtistGenres from "@/app/components/materials/ArtistGenres";
import SocialLinks from "@/app/components/materials/SocialLinks";
import Bio from "@/app/pages/artist/artist-profile/bio/Bio";
import ArtistSchedule from "@/app/pages/artist/artist-profile/schedule/ArtistSchedule";
import Albums from "@/app/pages/artist/artist-profile/albums/Albums";
import ArtistInsight from "@/app/pages/artist/artist-profile/artist-insights/ArtistInsight";
import RatingButton from "@/app/components/buttons/artist-buttons/RatingButton";
import ReviewButton from "@/app/components/buttons/artist-buttons/ReviewButton";
import LikeButton from "@/app/components/buttons/artist-buttons/LikeButton";

const AdsPage = () => {
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [animationKey, setAnimationKey] = useState(0);

  const handleRestartAnimation = () => {
    setAnimationKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen flex items-center justify-center ">
      {/* Mobile Frame - 9:16 aspect ratio */}
      <div className="w-full relative">
        <button
          onClick={handleRestartAnimation}
          className="absolute -top-10 left-0 px-4 py-2 bg-gold/30 hover:bg-gold/40 text-gold rounded-sm font-bold transition-colors"
        >
          repeat animation
        </button>
        <div>
          {!selectedArtist ? (
            <ArtistSearch onSelectArtist={setSelectedArtist} />
          ) : selectedArtist.artist_image ? (
            <div className="flex border items-center justify-center flex-col *:w-full h-[900px] overflow-hidden">
              <motion.div
                key={`section1-${animationKey}`}
                initial={{ y: 1000 }}
                animate={{ y: [1000, 0, 0, -1000] }}
                transition={{
                  duration: 5,
                  times: [0, 0.1, 0.9, 1],
                  ease: "easeInOut",
                }}
                className="grid lg:grid-cols-2 gap-2 lg:gap-5 items-center min-h-[80vh] p-3 lg:p-5 absolute "
              >
                <Avatar data={selectedArtist} />
                <ShowcaseBasicInfo data={selectedArtist} />
              </motion.div>
              <motion.div
                key={`section2-${animationKey}`}
                className="absolute"
                initial={{ y: 1000 }}
                animate={{ y: [1000, 0, 0, -1000] }}
                transition={{
                  duration: 5,
                  times: [0, 0.1, 0.9, 1],
                  ease: "easeInOut",
                  delay: 5,
                }}
              >
                <Bio data={selectedArtist} />
              </motion.div>
              <motion.div
                className="absolute"
                key={`section3-${animationKey}`}
                initial={{ y: 1000 }}
                animate={{ y: [1000, 0, 0, -1000] }}
                transition={{
                  duration: 5,
                  times: [0, 0.1, 0.9, 1],
                  ease: "easeInOut",
                  delay: 10,
                }}
              >
                <ArtistSchedule
                  artistId={selectedArtist.id}
                  artistData={selectedArtist}
                />
              </motion.div>
              <motion.div
                className="absolute"
                key={`section4-${animationKey}`}
                initial={{ y: 1000 }}
                animate={{ y: [1000, 0, 0, -1000] }}
                transition={{
                  duration: 5,
                  times: [0, 0.1, 0.9, 1],
                  ease: "easeInOut",
                  delay: 15,
                }}
              >
                <Albums artistId={selectedArtist.id} />
              </motion.div>
              <motion.div
                className="absolute"
                key={`section5-${animationKey}`}
                initial={{ y: 1000 }}
                animate={{ y: [1000, 0, 0, -1000] }}
                transition={{
                  duration: 5,
                  times: [0, 0.1, 0.9, 1],
                  ease: "easeInOut",
                  delay: 20,
                }}
              >
                <ArtistInsight artistId={selectedArtist.id} />
              </motion.div>
            </div>
          ) : (
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <h1 className="text-2xl text-gold mb-4">
                  Loading artist data...
                </h1>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ShowcaseBasicInfo = ({ data }) => {
  const [likesCount, setLikesCount] = useState(data.likesCount || 0);
  const [isLiked, setIsLiked] = useState(data.isLiked || false);
  const { name, stage_name, desc, label, country, city, social_links, genres } =
    data;
  const userRating = data.userRating || null;
  const userSubmittedArtistId = data.userSubmittedArtistId;

  const handleLikeChange = (updatedIsLiked, updatedLikesCount) => {
    setIsLiked(updatedIsLiked);
    setLikesCount(updatedLikesCount);
  };

  const updatedData = {
    ...data,
    likesCount: likesCount,
    isLiked: isLiked,
  };

  return (
    <div className="py-10 h-full overflow-hidden space-y-5 flex flex-col">
      {/* All Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="flex justify-end flex-wrap gap-2 xl:px-2"
      >
        <button className="bg-gold/30 hover:bg-gold/40 gap-1 text-gold w-fit secondary center cursor-pointer duration-300 p-1 rounded-xs text-sm font-bold">
          <FaHouse size={18} />
          <h1>Book</h1>
        </button>
        <RatingButton
          desc={userRating ? " " : "Rate"}
          artist={updatedData}
          userRating={userRating}
        />
        <LikeButton
          desc="Like"
          artist={updatedData}
          onLikeChange={handleLikeChange}
        />
        <ReviewButton desc="Review" artist={updatedData} />
      </motion.div>

      {/* Artist Info */}
      <div className="*:leading-none">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-gold"
        >
          {stage_name && (
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg secondary capitalize text-gold"
            >
              {name}
            </motion.h1>
          )}
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-bold text-5xl md:text-6xl lg:text-7xl uppercase"
          >
            {stage_name || name}
          </motion.h1>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <ArtistGenres genres={genres} />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <ArtistCountry artistCountry={{ country, city }} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="secondary text-chino text-xs lg:text-sm"
      >
        <p>{desc}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 1.0 }}
        className="flex items-center space-x-2"
      >
        {label?.map((item, idx) => (
          <h1
            key={idx}
            className="px-4 py-1 w-fit cursor-pointer duration-300 hover:bg-emperor/40 bg-cream/20 border border-cream/30 rounded-sm uppercase text-cream font-bold"
          >
            {item}
          </h1>
        ))}
      </motion.div>

      <SocialLinks
        social_links={social_links}
        className="space-y-4"
        animation={true}
        animationDelay={1.2}
      />
    </div>
  );
};

const ArtistSearch = ({ onSelectArtist }) => {
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (query) => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query)}`
      );
      const result = await response.json();
      if (result.results) {
        const artists = result.results.filter((item) => item.type === "artist");
        setResults(artists);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectArtist = async (artist) => {
    try {
      // Use the exact same API endpoint as the working artist profile page
      const response = await fetch(
        `/api/artists/artist-profile?id=${artist.id}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch artist: ${response.status}`);
      }

      const { artist: fullArtistData } = await response.json();

      if (!fullArtistData) {
        throw new Error("Artist not found");
      }

      onSelectArtist(fullArtistData);
    } catch (error) {
      console.error("Error fetching artist:", error);
      // Fallback to search result if API fails
      onSelectArtist(artist);
    }
  };

  return (
    <div className="min-h-[844px] flex flex-col items-center justify-center p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <h1 className="text-4xl font-bold text-gold uppercase">
          Artist Search
        </h1>
        <p className="text-chino text-sm">
          Find an artist to preview their profile
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="w-full"
      >
        <SearchBarWrapper onSearch={handleSearch} />
      </motion.div>

      <div className="w-full space-y-2 max-h-[500px] overflow-y-auto">
        {isSearching && (
          <div className="text-center text-gold py-4">Searching...</div>
        )}
        {results.map((artist, index) => (
          <motion.div
            key={artist.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => handleSelectArtist(artist)}
            className="p-3 bg-stone-900 border border-gold/30 rounded-lg cursor-pointer hover:bg-stone-800 transition-all duration-300"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 relative rounded-full overflow-hidden">
                <Image
                  src={artist.artist_image}
                  alt={artist.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-gold font-bold">
                  {artist.stage_name || artist.name}
                </h3>
                <p className="text-chino text-xs">{artist.country}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const SearchBarWrapper = ({ onSearch }) => {
  const [query, setQuery] = useState("");

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Search artists..."
        className="w-full px-4 py-3 bg-stone-900 border border-gold/30 rounded-lg text-cream placeholder-chino/50 focus:outline-none focus:border-gold"
      />
    </div>
  );
};

export default AdsPage;
