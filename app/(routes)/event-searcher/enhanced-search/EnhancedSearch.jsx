"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaSearch, FaTimes, FaHistory } from "react-icons/fa";
import { MdMusicNote } from "react-icons/md";
import ProductCard from "@/app/components/containers/ProductCard";

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const STORAGE_KEY = "enhanced_search_cache";

function loadCache() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > CACHE_TTL) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveCache(artists, data) {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ artists, data, timestamp: Date.now() }),
    );
  } catch {
    // ignore
  }
}

const EnhancedSearch = () => {
  const [inputs, setInputs] = useState(["", "", ""]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [prevSearch, setPrevSearch] = useState(null);
  const inputRefs = [useRef(null), useRef(null), useRef(null)];

  // Load previous search from cache on mount
  useEffect(() => {
    const cached = loadCache();
    if (cached) setPrevSearch(cached);
  }, []);

  const handleSearch = async () => {
    const terms = inputs.map((v) => v.trim()).filter(Boolean);
    if (terms.length === 0) return;
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const res = await fetch(
        `/api/events/enhanced-search?artists=${encodeURIComponent(terms.join(","))}`,
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Search failed");
      setResults({ artists: terms, data: json.data });
      saveCache(terms, json.data);
      setPrevSearch({ artists: terms, data: json.data, timestamp: Date.now() });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleInputChange = (idx, value) => {
    const next = [...inputs];
    next[idx] = value;
    setInputs(next);
  };

  const clearInput = (idx) => {
    const next = [...inputs];
    next[idx] = "";
    setInputs(next);
    inputRefs[idx].current?.focus();
  };

  const loadPrevSearch = () => {
    if (!prevSearch) return;
    setResults(prevSearch);
  };

  const hasTerms = inputs.some((v) => v.trim());
  const showPrev = prevSearch && !results && !loading;

  return (
    <div className="w-full space-y-8">
      {/* ── Search Inputs ── */}
      <div className="flex flex-col items-center gap-6">
        <p className="text-center text-sm text-chino secondary max-w-lg">
          Search for events featuring multiple artists on the same lineup. Enter
          up to 3 artist names - results will only show events where all
          searched artists appear together.
        </p>
        <div className="flex flex-col lg:flex-row items-center gap-4 w-full max-w-3xl">
          {inputs.map((value, idx) => (
            <div key={idx} className="relative w-full group">
              <div className="absolute z-5 left-4 top-1/2 -translate-y-1/2 text-gold/60 group-focus-within:text-gold transition-colors">
                <MdMusicNote size={20} />
              </div>
              <input
                ref={inputRefs[idx]}
                type="text"
                value={value}
                onChange={(e) => handleInputChange(idx, e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Artist ${idx + 1}`}
                className="w-full bg-stone-900 border border-chino/30 focus:border-gold/60 text-cream placeholder:text-chino/80 pl-11 pr-10 py-4 text-sm font-medium outline-none transition-all duration-300"
              />
              {value && (
                <button
                  type="button"
                  onClick={() => clearInput(idx)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-gold transition-colors"
                >
                  <FaTimes size={12} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Search button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSearch}
          disabled={loading || !hasTerms}
          className="flex items-center gap-3 px-10 py-4 bg-gold text-black font-bold text-sm uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:bg-gold/90"
        >
          <FaSearch size={14} />
          {loading ? "Searching..." : "Search Lineup"}
        </motion.button>

        {/* Previous search hint */}
        <AnimatePresence>
          {showPrev && (
            <motion.button
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              onClick={loadPrevSearch}
              className="flex items-center gap-2 text-xs text-chino cursor-pointer secondary hover:text-gold transition-colors bg-stone-900 border border-chino/30 hover:border-gold/40 px-4 py-2"
            >
              <FaHistory size={11} />
              View previous search for{" "}
              <span className="text-gold font-bold uppercase">
                {prevSearch.artists.join(" & ")}
              </span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── Error ── */}
      {error && <p className="text-center text-red-400 text-sm">{error}</p>}

      {/* ── Results ── */}
      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <p className="text-xs text-chino secondary mb-4 text-center">
              {results.data.length === 0
                ? `No events found for "${results.artists.join(" & ")}"`
                : `${results.data.length} Event${results.data.length !== 1 ? "s" : ""} featuring ${results.artists.join(" & ")}`}
            </p>

            {results.data.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {results.data.map((event, idx) => (
                  <ProductCard
                    key={event.id}
                    id={event.id}
                    image={event.image_url}
                    name={event.event_name || event.venue_name}
                    country={event.country}
                    city={event.city}
                    artists={event.artists || []}
                    date={
                      event.date
                        ? new Date(event.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "2-digit",
                            year: "numeric",
                          })
                        : null
                    }
                    href={`/events/${event.event_slug}`}
                    delay={idx}
                    type="event"
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedSearch;
