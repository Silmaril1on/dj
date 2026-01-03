"use client";
import React, { useState } from "react";
import BandsinTown from "./BandsinTown";
import RaEvents from "./RaEvents";
import MusicBrainzAlbums from "./MusicBrainzAlbums";

const ApifyPage = () => {
  // Only tab state - all business logic is in components
  const [activeTab, setActiveTab] = useState("bandsintown");

  return (
    <div className="min-h-screen bg-black p-8">
      <h1 className="text-4xl font-bold mb-8 text-cream-100">
        Apify - Event Scraper
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("bandsintown")}
          className={`px-6 py-3 font-bold transition-colors ${
            activeTab === "bandsintown"
              ? "bg-gold text-black"
              : "bg-neutral-900 text-cream border border-gold/30 hover:border-gold"
          }`}
        >
          Bandsintown
        </button>
        <button
          onClick={() => setActiveTab("ra-events")}
          className={`px-6 py-3 font-bold transition-colors ${
            activeTab === "ra-events"
              ? "bg-gold text-black"
              : "bg-neutral-900 text-cream border border-gold/30 hover:border-gold"
          }`}
        >
          RA Events
        </button>
        <button
          onClick={() => setActiveTab("musicbrainz")}
          className={`px-6 py-3 font-bold transition-colors ${
            activeTab === "musicbrainz"
              ? "bg-gold text-black"
              : "bg-neutral-900 text-cream border border-gold/30 hover:border-gold"
          }`}
        >
          MusicBrainz
        </button>
      </div>

      {/* Render active component */}
      {activeTab === "bandsintown" && <BandsinTown />}
      {activeTab === "ra-events" && <RaEvents />}
      {activeTab === "musicbrainz" && <MusicBrainzAlbums />}
    </div>
  );
};

export default ApifyPage;
