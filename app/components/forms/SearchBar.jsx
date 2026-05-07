"use client";
import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FaSearch } from "react-icons/fa";
import { motion } from "framer-motion";
import Spinner from "../ui/Spinner";
import ArtistCountry from "../materials/ArtistCountry";
import { resolveImage } from "@/app/helpers/utils";

/** Resolve the display name for any search result type */
const getItemName = (item) => {
  if (item.type === "artist") return item.stage_name || item.name;
  if (item.type === "club") return item.name;
  if (item.type === "event") return item.event_name || item.title || item.name;
  if (item.type === "festival") return item.name;
  return item.name || "";
};

/** Resolve the navigation URL for any search result type */
const getItemHref = (item) => {
  if (item.type === "artist") return `/artists/${item.artist_slug}`;
  if (item.type === "club") return `/clubs/${item.club_slug || item.id}`;
  if (item.type === "event") return `/events/${item.event_slug || item.id}`;
  if (item.type === "festival")
    return `/festivals/${item.festival_slug || item.id}`;
  return "/";
};

const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const router = useRouter();
  const timeoutRef = useRef();
  const abortRef = useRef();
  const listRef = useRef();

  const handleChange = (e) => {
    e.stopPropagation();
    const value = e.target.value;
    setQuery(value);
    setActiveIndex(-1);
    clearTimeout(timeoutRef.current);

    if (value.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    timeoutRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`, {
          signal: abortRef.current.signal,
        });
        const data = await res.json();
        setResults(data.results || []);
        setShowDropdown(true);
      } catch (err) {
        if (err.name !== "AbortError") {
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleSelect = useCallback(
    (item) => {
      setShowDropdown(false);
      setQuery("");
      setActiveIndex(-1);
      router.push(getItemHref(item));
    },
    [router],
  );

  const handleKeyDown = (e) => {
    if (!showDropdown || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => {
        const next = prev < results.length - 1 ? prev + 1 : 0;
        scrollActiveIntoView(next);
        return next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => {
        const next = prev > 0 ? prev - 1 : results.length - 1;
        scrollActiveIntoView(next);
        return next;
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < results.length) {
        handleSelect(results[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      setActiveIndex(-1);
    }
  };

  const scrollActiveIntoView = (index) => {
    const list = listRef.current;
    if (!list) return;
    const item = list.children[index];
    item?.scrollIntoView({ block: "nearest" });
  };

  const listboxId = "search-listbox";

  return (
    <motion.div
      initial={{ y: "-100px" }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4, delay: 0.7 }}
      className="relative center w-full"
    >
      <div className="relative w-full">
        <input
          id="search-bar"
          type="text"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-activedescendant={
            activeIndex >= 0 ? `search-option-${activeIndex}` : undefined
          }
          aria-autocomplete="list"
          autoComplete="off"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
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
        <div
          id={listboxId}
          role="listbox"
          aria-label="Search results"
          ref={listRef}
          className="absolute left-0 right-0 top-8 mt-2 bg-stone-900 shadow-lg z-10 max-h-80 overflow-auto"
        >
          {loading && <Spinner />}
          {!loading && results.length === 0 && (
            <div className="p-4 text-center text-stone-400">
              No results found.
            </div>
          )}
          {results.map((item, index) => (
            <div
              key={`${item.type}-${item.id}`}
              id={`search-option-${index}`}
              role="option"
              aria-selected={activeIndex === index}
              className={`flex items-center gap-2 py-1 px-2 cursor-pointer transition-colors ${
                activeIndex === index ? "bg-stone-700" : "hover:bg-stone-800"
              }`}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <img
                src={
                  resolveImage(item.image_url, "sm") ||
                  "/assets/elivagar-logo.png"
                }
                alt={getItemName(item)}
                className="w-8 h-8 rounded object-cover flex-shrink-0"
              />

              <div className="w-full *:capitalize leading-none overflow-hidden">
                <div className="font-bold text-gold uppercase truncate">
                  {getItemName(item)}
                </div>
                <div className="text-[10px] lg:text-xs text-stone-400 flex items-center gap-1">
                  <ArtistCountry
                    artistCountry={{ country: item.country }}
                    size="small"
                  />
                  {item.type === "artist" && item.genres?.length > 0 && (
                    <span className="hidden lg:inline text-cream/90 truncate">
                      • {item.genres.slice(0, 3).join(", ")}
                    </span>
                  )}
                  {item.type === "event" && item.venue_name && (
                    <span className="text-cream/50 truncate">
                      • {item.venue_name}
                    </span>
                  )}
                </div>
              </div>
              <span className="ml-auto flex-shrink-0 text-xs px-2 py-1 bg-chino/30 text-cream font-bold">
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
