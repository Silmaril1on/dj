"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaSearch, FaTimes, FaHistory } from "react-icons/fa";
import { MdMusicNote } from "react-icons/md";
import ProductCard from "@/app/components/containers/ProductCard";
import Button from "@/app/components/buttons/Button";
import usePagination from "@/app/lib/hooks/usePagination";

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const STORAGE_KEY = "enhanced_search_cache";
const LIMIT = 20;

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

function saveCache(artists, data, hasMore = false) {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ artists, data, hasMore, timestamp: Date.now() }),
    );
  } catch {
    // ignore
  }
}

function normalizeSearchItems(items) {
  return (items || []).map((item) => {
    const type = item.type || "event";

    return {
      ...item,
      type,
      original_id: item.original_id || item.id,
      id: `${type}-${item.edition_id || item.original_id || item.id}`,
    };
  });
}

const EnhancedSearch = () => {
  const [inputs, setInputs] = useState(["", "", ""]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [prevSearch, setPrevSearch] = useState(null);
  const inputRefs = [useRef(null), useRef(null), useRef(null)];
  const resultArtists = results?.artists;

  const fetchPage = useCallback(
    async ({ limit, offset }) => {
      if (!resultArtists?.length) return { data: [], hasMore: false };
      const params = new URLSearchParams({
        artists: resultArtists.join(","),
        limit: String(limit),
        offset: String(offset),
      });
      const res = await fetch(`/api/events/enhanced-search?${params}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Search failed");
      return {
        data: normalizeSearchItems(json.data),
        hasMore: Boolean(json.hasMore),
      };
    },
    [resultArtists],
  );

  const {
    data,
    loading: loadingMore,
    hasMore,
    loadMore,
    reset,
    setHasMore,
  } = usePagination({
    initialData: [],
    limit: LIMIT,
    initialHasMore: false,
    fetchPage,
    onError: (err) => setError(err.message),
  });

  // Load previous search from cache on mount
  useEffect(() => {
    const cached = loadCache();
    if (cached) {
      setPrevSearch({
        ...cached,
        data: normalizeSearchItems(cached.data),
        hasMore: Boolean(cached.hasMore),
      });
    }
  }, []);

  const handleSearch = async () => {
    const terms = inputs.map((v) => v.trim()).filter(Boolean);
    if (terms.length === 0) return;
    setLoading(true);
    setError(null);
    setResults(null);
    await reset([]);
    setHasMore(false);
    try {
      const params = new URLSearchParams({
        artists: terms.join(","),
        limit: String(LIMIT),
        offset: "0",
      });
      const res = await fetch(`/api/events/enhanced-search?${params}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Search failed");
      const normalizedData = normalizeSearchItems(json.data);
      const nextSearch = {
        artists: terms,
        data: normalizedData,
        hasMore: Boolean(json.hasMore),
        timestamp: Date.now(),
      };
      setResults(nextSearch);
      await reset(normalizedData);
      setHasMore(Boolean(json.hasMore));
      saveCache(terms, normalizedData, Boolean(json.hasMore));
      setPrevSearch(nextSearch);
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
    reset(prevSearch.data || []);
    setHasMore(Boolean(prevSearch.hasMore));
  };

  const hasTerms = inputs.some((v) => v.trim());
  const showPrev = prevSearch && !results && !loading;

  return (
    <div className="w-full space-y-8">
      {/* ── Search Inputs ── */}
      <div className="flex flex-col items-center gap-6">
        <p className="text-center text-sm text-chino secondary max-w-lg">
          Search for events and festivals featuring multiple artists on the same
          lineup. Enter up to 3 artist names - results will only show lineups
          where all searched artists appear together.
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
              {data.length === 0
                ? `No lineups found for "${results.artists.join(" & ")}"`
                : `${data.length} Result${data.length !== 1 ? "s" : ""} featuring ${results.artists.join(" & ")}`}
            </p>

            {data.length > 0 && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {data.map((item, idx) => {
                    const isFestival = item.type === "festival";
                    const dateValue = isFestival ? item.start_date : item.date;

                    return (
                      <ProductCard
                        key={item.id}
                        id={item.id}
                        image={item.image_url}
                        name={
                          isFestival
                            ? item.name
                            : item.event_name || item.venue_name
                        }
                        country={item.country}
                        city={item.city}
                        artists={item.artists || []}
                        date={
                          dateValue
                            ? new Date(dateValue).toLocaleDateString("en-US", {
                                month: "short",
                                day: "2-digit",
                                year: "numeric",
                              })
                            : null
                        }
                        href={
                          isFestival
                            ? `/festivals/${item.festival_slug}`
                            : `/events/${item.event_slug}`
                        }
                        delay={idx % LIMIT}
                        type={isFestival ? "festival" : "event"}
                      />
                    );
                  })}
                </div>

                {hasMore && (
                  <div className="flex justify-center pt-5">
                    <Button
                      text={loadingMore ? "Loading..." : "Load More"}
                      onClick={loadMore}
                      loading={loadingMore}
                      disabled={loadingMore}
                    />
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedSearch;
