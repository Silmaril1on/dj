"use client";
import React, { useState } from "react";
import Button from "@/app/components/buttons/Button";
import Image from "next/image";
import { FaCheck } from "react-icons/fa";

// JsonViewer components
const JsonValue = ({ value, keyName }) => {
  const getValueColor = (val, key) => {
    if (val === null) return "text-gray-500";
    if (typeof val === "string") {
      if (val.startsWith("http")) return "text-blue-400";
      if (key === "timezone") return "text-purple-400";
      if (key === "title" || key === "name") return "text-pink-400";
      if (key === "genres" || key === "genreArtists") return "text-orange-400";
      return "text-emerald-400";
    }
    if (typeof val === "number") return "text-cyan-400";
    if (typeof val === "boolean") return "text-yellow-400";
    return "text-gray-300";
  };

  const formatValue = (val) => {
    if (val === null) return "null";
    if (typeof val === "string") return `"${val}"`;
    if (typeof val === "boolean") return val.toString();
    return val;
  };

  return (
    <span className={getValueColor(value, keyName)}>{formatValue(value)}</span>
  );
};

const JsonViewer = ({ data, level = 0 }) => {
  const [collapsed, setCollapsed] = useState({});

  const toggleCollapse = (key) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const indent = level * 20;

  if (typeof data !== "object" || data === null) {
    return <JsonValue value={data} />;
  }

  if (Array.isArray(data)) {
    return (
      <div>
        <span className="text-cream-200">[</span>
        {data.map((item, index) => (
          <div key={index} style={{ marginLeft: `${indent + 20}px` }}>
            <JsonViewer data={item} level={level + 1} />
            {index < data.length - 1 && (
              <span className="text-cream-200">,</span>
            )}
          </div>
        ))}
        <div style={{ marginLeft: `${indent}px` }}>
          <span className="text-cream-200">]</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {Object.entries(data).map(([key, value], index, arr) => (
        <div key={key} style={{ marginLeft: `${indent}px` }} className="py-0.5">
          <span className="text-amber-300">&quot;{key}&quot;</span>
          <span className="text-cream-200">: </span>
          {typeof value === "object" && value !== null ? (
            <>
              <button
                onClick={() => toggleCollapse(key)}
                className="text-cream-300 hover:text-cream-100 text-xs mr-2"
              >
                {collapsed[key] ? "▶" : "▼"}
              </button>
              {!collapsed[key] && <JsonViewer data={value} level={level + 1} />}
              {collapsed[key] && (
                <span className="text-gray-500">
                  {Array.isArray(value) ? "[...]" : "{...}"}
                </span>
              )}
            </>
          ) : (
            <JsonValue value={value} keyName={key} />
          )}
          {index < arr.length - 1 && <span className="text-cream-200">,</span>}
        </div>
      ))}
    </div>
  );
};

export default function BandsinTown() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [expandedItems, setExpandedItems] = useState({});

  // Artist search states
  const [artistSearch, setArtistSearch] = useState("");
  const [artistResults, setArtistResults] = useState([]);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [searchingArtist, setSearchingArtist] = useState(false);

  // Event selection states
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [insertingSchedule, setInsertingSchedule] = useState(false);
  const [insertingEvents, setInsertingEvents] = useState(false);
  const [insertSuccess, setInsertSuccess] = useState(null);

  const handleStart = async () => {
    if (!url) {
      setError("Please enter a URL");
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);
    setSelectedEvents([]);

    try {
      const response = await fetch("/api/apify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to scrape data");
      }

      console.log("🎯 Apify Results:", data.data);
      console.log("📊 Total items:", data.data.length);
      setResults(data.data);
    } catch (err) {
      console.error("❌ Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleArtistSearch = async () => {
    if (!artistSearch.trim()) {
      setArtistResults([]);
      return;
    }

    setSearchingArtist(true);
    try {
      const response = await fetch(
        `/api/artists/search?name=${encodeURIComponent(artistSearch)}`
      );
      const data = await response.json();

      if (response.ok) {
        setArtistResults(data.artists || []);
      } else {
        console.error("Artist search error:", data.error);
        setArtistResults([]);
      }
    } catch (err) {
      console.error("Artist search failed:", err);
      setArtistResults([]);
    } finally {
      setSearchingArtist(false);
    }
  };

  const selectArtist = (artist) => {
    setSelectedArtist(artist);
    setArtistResults([]);
    setArtistSearch(artist.stage_name || artist.name);
  };

  const toggleEventSelection = (index) => {
    setSelectedEvents((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const toggleSelectAll = () => {
    if (selectedEvents.length === results?.length) {
      setSelectedEvents([]);
    } else {
      setSelectedEvents(results?.map((_, index) => index) || []);
    }
  };

  const handleAddToSchedule = async () => {
    if (!selectedArtist) {
      setError("Please select an artist first");
      return;
    }

    if (selectedEvents.length === 0) {
      setError("Please select at least one event");
      return;
    }

    setInsertingSchedule(true);
    setError(null);
    setInsertSuccess(null);

    try {
      const eventsToInsert = selectedEvents.map((index) => results[index]);

      const response = await fetch("/api/artists/schedule/insert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          artistId: selectedArtist.id,
          events: eventsToInsert,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to insert schedules");
      }

      console.log("✅ Insert success:", data);
      setInsertSuccess(data);
      setSelectedEvents([]);
    } catch (err) {
      console.error("❌ Insert error:", err);
      setError(err.message);
    } finally {
      setInsertingSchedule(false);
    }
  };

  const toggleItem = (index) => {
    setExpandedItems((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div>
      {/* URL Input Section */}
      <div className="bg-neutral-900 border border-gold/30 p-6 mb-6">
        <div className="mb-6">
          <label className="block text-sm font-bold uppercase text-cream mb-2">
            Bandsintown URL
          </label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.bandsintown.com/a/289657-boris-brejcha"
          />
        </div>

        <Button
          text={loading ? "⏳ Scraping..." : "▶ Start"}
          onClick={handleStart}
          disabled={loading}
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg mb-6">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {/* Success Display */}
      {insertSuccess && (
        <div className="bg-green-900/20 border border-green-500/50 text-green-300 px-4 py-3 mb-6">
          <p className="font-semibold">✅ Success!</p>
          <p>
            Inserted {insertSuccess.inserted} of {insertSuccess.total} events to
            artist schedule
          </p>
          {insertSuccess.errors && insertSuccess.errors.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-red-300">Some events failed:</p>
              <ul className="text-xs mt-1">
                {insertSuccess.errors.map((err, idx) => (
                  <li key={idx}>
                    {err.event}: {err.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Results Section */}
      {results && (
        <>
          <div className="bg-neutral-900 border border-gold/30 p-6 mb-6">
            <h2 className="text-2xl font-bold text-cream mb-4">
              SELECT ARTIST
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-bold uppercase text-cream mb-2">
                Search Artist by Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={artistSearch}
                  onChange={(e) => setArtistSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleArtistSearch()}
                  placeholder="Type artist name (e.g., Boris Brejcha)"
                  className="flex-1"
                />
                <Button
                  text={searchingArtist ? "🔍" : "Search"}
                  onClick={handleArtistSearch}
                  disabled={searchingArtist}
                />
              </div>
            </div>

            {artistResults.length > 0 && (
              <div className="space-y-2 mb-4">
                {artistResults.map((artist) => (
                  <button
                    key={artist.id}
                    onClick={() => selectArtist(artist)}
                    className="w-full px-4 py-3 bg-black border border-gold/30 hover:border-gold transition-colors flex items-center gap-4"
                  >
                    {artist.artist_image && (
                      <Image
                        width={400}
                        height={400}
                        src={artist.artist_image}
                        alt={artist.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    )}
                    <div className="text-left">
                      <p className="text-cream font-semibold">
                        {artist.stage_name || artist.name}
                      </p>
                      {artist.stage_name && (
                        <p className="text-cream-600 text-sm">{artist.name}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedArtist && (
              <div className="bg-black border border-green-500/50 p-4 flex items-center gap-4">
                {selectedArtist.artist_image && (
                  <Image
                    width={400}
                    height={400}
                    src={selectedArtist.artist_image}
                    alt={selectedArtist.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                )}
                <div className="flex-1">
                  <p className="text-green-400 font-semibold text-lg">
                    ✓ Selected Artist
                  </p>
                  <p className="text-cream">
                    {selectedArtist.stage_name || selectedArtist.name}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedArtist(null)}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          <div className="bg-neutral-900 border border-gold/30 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-cream">
                EVENTS ({results.length} items)
              </h2>
              <div className="flex gap-4 items-center">
                <button
                  onClick={toggleSelectAll}
                  className="text-gold hover:text-cream text-sm font-medium"
                >
                  {selectedEvents.length === results.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
                {selectedEvents.length > 0 && (
                  <span className="text-cream text-sm">
                    {selectedEvents.length} selected
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {results.map((item, index) => (
                <div
                  key={index}
                  className={`bg-stone-900 border overflow-hidden transition-colors ${selectedEvents.includes(index) ? "border-gold" : "border-gold/30"}`}
                >
                  <div className="px-6 py-4 flex items-center gap-4">
                    <div
                      onClick={() => toggleEventSelection(index)}
                      role="checkbox"
                      aria-checked={selectedEvents.includes(index)}
                      className={`w-3 h-3 border z-10 cursor-pointer flex items-center justify-center transition-colors ${selectedEvents.includes(index) ? "bg-gold/80" : "bg-stone-800 border-gold/30 hover:border-gold"}`}
                    >
                      {selectedEvents.includes(index) && (
                        <FaCheck className="text-white text-[8px]" />
                      )}
                    </div>
                    <button
                      onClick={() => toggleItem(index)}
                      className="flex-1 flex items-center justify-between hover:opacity-80 transition-opacity text-left"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-cream font-mono">
                          {expandedItems[index] ? "▼" : "▶"}
                        </span>
                        <div>
                          <p className="text-cream-100 font-semibold">
                            {item.title || item.name || `Item ${index + 1}`}
                          </p>
                        </div>
                      </div>
                      <span className="text-cream-600 text-sm">
                        {Object.keys(item).length} fields
                      </span>
                    </button>
                  </div>

                  {expandedItems[index] && (
                    <div className="px-6 py-4 bg-black border-t border-cream-700/20">
                      <div className="font-mono text-sm overflow-x-auto">
                        <JsonViewer data={item} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {selectedEvents.length > 0 && (
              <div className="mt-6 flex justify-end gap-4">
                <Button
                  text={
                    insertingSchedule
                      ? "⏳ Adding to Schedule..."
                      : `➕ Add ${selectedEvents.length} Event${selectedEvents.length > 1 ? "s" : ""} to Schedule`
                  }
                  onClick={handleAddToSchedule}
                  disabled={!selectedArtist || insertingSchedule}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
