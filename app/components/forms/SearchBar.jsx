"use client"
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { FaSearch } from "react-icons/fa";
import {motion} from "framer-motion"
import Spinner from "../ui/Spinner";

const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();
  const timeoutRef = useRef();

  const handleChange = (e) => {
    e.stopPropagation();
    const value = e.target.value;
    setQuery(value);
    clearTimeout(timeoutRef.current);

    if (value.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    timeoutRef.current = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
      const data = await res.json();
      setResults(data.results || []);
      setShowDropdown(true);
      setLoading(false);
    }, 300);
  };

  const handleSelect = (item) => {
    setShowDropdown(false);
    setQuery("");
    if (item.type === "artist") router.push(`/artists/${item.id}`);
    if (item.type === "club") router.push(`/clubs/${item.id}`);
    if (item.type === "event") router.push(`/events/${item.id}`);
  };

  return (
    <motion.div initial={{ y: "-100px"}} animate={{y: 0}} transition={{duration: 0.4, delay: 0.7}} className="relative center w-full">
      <div className="relative w-full">
        <input
        id="search-bar"
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Search artists, clubs, events..."
          onFocus={() => query.length > 1 && setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          className="w-full pr-10 lg:py-1" 
        />
        <FaSearch
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gold pointer-events-none"
          size={15}
        />
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-8 mt-2 bg-stone-900 shadow-lg z-10 max-h-80 overflow-auto">
          {loading && <Spinner />}
          {!loading && results.length === 0 && (
            <div className="p-4 text-center text-stone-400">
              No results found.
            </div>
          )}
          {results.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              className="flex items-center gap-2 py-1 px-2 cursor-pointer hover:bg-stone-800"
              onClick={() => handleSelect(item)}
            >
              <img
                src={
                  item.type === "artist"
                    ? item.artist_image
                    : item.type === "club"
                    ? item.club_image
                    : item.event_image
                }
                alt={item.name || item.stage_name || item.event_name}
                className="w-8 h-8 rounded object-cover"
              />

              <div>
                <div className="font-bold text-gold uppercase">
                  {item.type === "artist" && (item.stage_name || item.name)}
                  {item.type === "club" && item.name}
                  {item.type === "event" && item.event_name}
                </div>
                <div className="text-[10px] text-stone-400">
                  {item.country}, {item.city}
                 <div className="hidden lg:block">
                   {item.type === "artist" &&
                    item.genres &&
                    ` • ${item.genres.join(", ")}`}
                 </div>
                  {item.type === "event" &&
                    item.venue_name &&
                    ` • ${item.venue_name}`}
                </div>
              </div>
              <span className="ml-auto text-xs px-2 py-1 bg-chino/30 text-cream font-bold">
                {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default SearchBar;
