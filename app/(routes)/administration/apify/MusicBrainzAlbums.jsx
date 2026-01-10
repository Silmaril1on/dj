"use client";
import React, { useState } from "react";
import Image from "next/image";
import Button from "@/app/components/buttons/Button";
import Spinner from "@/app/components/ui/Spinner";
import Paragraph from "@/app/components/ui/Paragraph";
import Title from "@/app/components/ui/Title";
import { FaCheck, FaCheckCircle, FaDownload, FaClock } from "react-icons/fa";
import { SiMusicbrainz } from "react-icons/si";
import { useDispatch, useSelector } from "react-redux";
import { selectUser } from "@/app/features/userSlice";
import { setError } from "@/app/features/modalSlice";

export default function MusicBrainzAlbums() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  // Search mode toggle
  const [searchMode, setSearchMode] = useState("database"); // "database" or "musicbrainz"

  // MusicBrainz states
  const [searchTerm, setSearchTerm] = useState("");
  const [artists, setArtists] = useState([]);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [artistBasicInfo, setArtistBasicInfo] = useState(null);
  const [albums, setAlbums] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingAlbums, setIsLoadingAlbums] = useState(false);
  const [isLoadingBasicInfo, setIsLoadingBasicInfo] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState(new Set());
  const [isInsertingArtist, setIsInsertingArtist] = useState(false);
  const [importingAlbumId, setImportingAlbumId] = useState(null);
  const [importedAlbums, setImportedAlbums] = useState(new Set());

  // Select Multiple State
  const [selectMode, setSelectMode] = useState(false);
  const [selectedAlbums, setSelectedAlbums] = useState(new Set());
  const [isImportingSelected, setIsImportingSelected] = useState(false);

  const [apiResponses, setApiResponses] = useState({
    preview: null,
    singleImport: null,
    bulkImport: null,
  });

  const handleSearch = async () => {
    const trimmedSearch = searchTerm.trim();
    if (!trimmedSearch) return;

    setIsSearching(true);
    setArtists([]);
    setAlbums([]);
    setSelectedArtist(null);
    setArtistBasicInfo(null);

    try {
      const url =
        searchMode === "database"
          ? `/api/automation/search-artists?q=${encodeURIComponent(trimmedSearch)}`
          : `/api/automation/artist-album/search-musicbrainz?q=${encodeURIComponent(trimmedSearch)}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.results) {
        setArtists(data.results);
      } else {
        setArtists([]);
      }
    } catch (err) {
      setArtists([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectArtist = async (artist) => {
    setSelectedArtist(artist);
    setAlbums([]);
    setImportedAlbums(new Set());
    setArtistBasicInfo(null);
    setSelectedGenres(new Set());

    // If MusicBrainz artist, fetch basic info first
    if (searchMode === "musicbrainz" && artist.musicbrainz_id) {
      setIsLoadingBasicInfo(true);
      try {
        const response = await fetch(
          `/api/automation/artist-album/artist-basic-info?mbid=${artist.musicbrainz_id}`
        );
        const data = await response.json();

        if (data.success) {
          setArtistBasicInfo(data.data);
        }
      } catch (err) {
        console.error("Error fetching artist basic info:", err);
      } finally {
        setIsLoadingBasicInfo(false);
      }
    }

    // Then fetch albums
    setIsLoadingAlbums(true);
    try {
      const artistId =
        searchMode === "database" ? artist.id : artist.musicbrainz_id;
      const url = `/api/automation/artist-album/preview-albums?artistId=${artistId}`;
      const response = await fetch(url);
      const data = await response.json();

      setApiResponses((prev) => ({ ...prev, preview: data }));

      if (data.success && data.albums) {
        setAlbums(data.albums);
        const imported = new Set(
          data.albums.filter((a) => a.alreadyImported).map((a) => a.id)
        );
        setImportedAlbums(imported);
      } else {
        dispatch(
          setError({
            message: data.error || "Failed to fetch albums",
            type: "error",
          })
        );
      }
    } catch (err) {
      dispatch(
        setError({
          message: "Failed to fetch albums from MusicBrainz",
          type: "error",
        })
      );
    } finally {
      setIsLoadingAlbums(false);
    }
  };

  const handleImportAlbum = async (album) => {
    setImportingAlbumId(album.id);

    try {
      const response = await fetch(
        "/api/automation/artist-album/import-single-album",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ artistId: selectedArtist.id, album }),
        }
      );

      const data = await response.json();
      setApiResponses((prev) => ({ ...prev, singleImport: data }));

      if (response.ok && data.success) {
        dispatch(setError({ message: data.message, type: "success" }));
        setImportedAlbums((prev) => new Set([...prev, album.id]));
      } else {
        dispatch(
          setError({
            message: data.error || "Failed to import album",
            type: "error",
          })
        );
      }
    } catch (err) {
      dispatch(setError({ message: "Failed to import album", type: "error" }));
    } finally {
      setImportingAlbumId(null);
    }
  };

  const handleImportAll = async () => {
    const albumsToImport = albums.filter(
      (a) => !a.alreadyImported && !importedAlbums.has(a.id)
    );
    for (const album of albumsToImport) {
      await handleImportAlbum(album);
    }
  };

  const toggleSelectMode = () => {
    setSelectMode(!selectMode);
    setSelectedAlbums(new Set());
  };

  const toggleAlbumSelection = (albumId) => {
    setSelectedAlbums((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(albumId)) newSet.delete(albumId);
      else newSet.add(albumId);
      return newSet;
    });
  };

  const handleImportSelected = async () => {
    if (selectedAlbums.size === 0) return;
    setIsImportingSelected(true);
    const albumsToImport = albums.filter((a) => selectedAlbums.has(a.id));
    for (const album of albumsToImport) await handleImportAlbum(album);
    setIsImportingSelected(false);
    setSelectedAlbums(new Set());
    setSelectMode(false);
  };

  const handleDemoBulkImport = async () => {
    if (!selectedArtist) return;
    try {
      const response = await fetch(
        "/api/automation/artist-album/import-albums",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ artistId: selectedArtist.id }),
        }
      );
      const data = await response.json();
      setApiResponses((prev) => ({ ...prev, bulkImport: data }));
      if (data.success) {
        dispatch(setError({ message: data.message, type: "success" }));
        handleSelectArtist(selectedArtist);
      }
    } catch (err) {
      // silent
    }
  };

  const toggleGenreSelection = (genre) => {
    setSelectedGenres((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(genre)) {
        newSet.delete(genre);
      } else {
        newSet.add(genre);
      }
      return newSet;
    });
  };

  const handleInsertArtist = async () => {
    if (!artistBasicInfo) return;

    setIsInsertingArtist(true);
    try {
      const socialLinks = Object.values(
        artistBasicInfo.externalLinks || {}
      ).filter(Boolean);
      const selectedGenresArray = Array.from(selectedGenres);

      const artistData = {
        name: artistBasicInfo.name, // Real name (legalName if exists, otherwise artist name)
        stage_name: artistBasicInfo.stageName, // Stage name (null if artist uses real name)
        sex: artistBasicInfo.gender,
        birth: artistBasicInfo.birthDate,
        country: artistBasicInfo.country, // Full country name
        city: artistBasicInfo.birthCity || artistBasicInfo.beginArea,
        social_links: socialLinks,
        genres: selectedGenresArray,
        musicbrainz_artist_id: artistBasicInfo.mbid,
      };

      const response = await fetch(
        "/api/automation/artist-album/insert-artist",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(artistData),
        }
      );

      const data = await response.json();

      if (data.success) {
        dispatch(
          setError({
            message: "Artist inserted successfully!",
            type: "success",
          })
        );
        // Optionally reset or update UI
      } else {
        dispatch(
          setError({
            message: data.error || "Failed to insert artist",
            type: "error",
          })
        );
      }
    } catch (err) {
      dispatch(setError({ message: "Failed to insert artist", type: "error" }));
    } finally {
      setIsInsertingArtist(false);
    }
  };

  if (!user?.is_admin) {
    return (
      <div className="min-h-screen bg-black p-8 flex items-center justify-center">
        <p className="text-cream text-xl">Access denied. Admin only.</p>
      </div>
    );
  }

  console.log(artists, "////////");
  console.log(artistBasicInfo, "ARTISTS");

  return (
    <div className="space-y-6">
      <div className="bg-neutral-900 border border-gold/30 p-6 mb-6">
        <div className="mb-4">
          <label className="block text-sm font-bold uppercase text-cream ">
            Search Mode
          </label>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => {
                setSearchMode("database");
                setArtists([]);
                setSelectedArtist(null);
                setArtistBasicInfo(null);
              }}
              className={`px-4 py-2 font-bold rounded transition-colors ${
                searchMode === "database"
                  ? "bg-gold text-black"
                  : "bg-stone-800 text-cream hover:bg-stone-700"
              }`}
            >
              Database Artists
            </button>
            <button
              onClick={() => {
                setSearchMode("musicbrainz");
                setArtists([]);
                setSelectedArtist(null);
                setArtistBasicInfo(null);
              }}
              className={`px-4 py-2 font-bold rounded transition-colors ${
                searchMode === "musicbrainz"
                  ? "bg-gold text-black"
                  : "bg-stone-800 text-cream hover:bg-stone-700"
              }`}
            >
              <SiMusicbrainz className="inline mr-2" />
              MusicBrainz Direct
            </button>
          </div>

          <label className="block text-sm font-bold uppercase text-cream ">
            Search {searchMode === "database" ? "Your Artists" : "MusicBrainz"}
          </label>
          <p className="secondary text-[10px] mb-2">
            {searchMode === "database"
              ? "Search your database and import albums from MusicBrainz"
              : "Search MusicBrainz directly for artist info and albums"}
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder={
                searchMode === "database"
                  ? "Search for artist in your database..."
                  : "Search MusicBrainz (e.g., Argy, Axwell)..."
              }
              className="flex-1"
            />
            <Button
              text={isSearching ? "🔍" : "Search"}
              onClick={handleSearch}
              disabled={isSearching}
            />
          </div>
        </div>

        {artists.length > 0 && (
          <div className="space-y-2 mb-4">
            {artists.map((artist, index) => (
              <button
                key={artist.musicbrainz_id || artist.id || `artist-${index}`}
                onClick={() => handleSelectArtist(artist)}
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
          <div className="mt-6 space-y-4">
            {/* Artist Basic Info Section (for MusicBrainz mode) */}
            {searchMode === "musicbrainz" && artistBasicInfo && (
              <div className="bg-stone-900 border border-gold/30 p-6 rounded space-y-4">
                <Title text="Artist Basic Information" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-chino/70 uppercase">
                      Performance Name
                    </label>
                    <p className="text-cream font-semibold">
                      {artistBasicInfo.stageName || artistBasicInfo.name}
                    </p>
                  </div>
                  {artistBasicInfo.legalName && (
                    <div>
                      <label className="text-xs text-chino/70 uppercase">
                        Legal Name
                      </label>
                      <p className="text-cream font-semibold">
                        {artistBasicInfo.legalName}
                      </p>
                    </div>
                  )}
                  {artistBasicInfo.gender && (
                    <div>
                      <label className="text-xs text-chino/70 uppercase">
                        Gender
                      </label>
                      <p className="text-cream capitalize">
                        {artistBasicInfo.gender}
                      </p>
                    </div>
                  )}
                  {artistBasicInfo.birthDate && (
                    <div>
                      <label className="text-xs text-chino/70 uppercase">
                        Born
                      </label>
                      <p className="text-cream">{artistBasicInfo.birthDate}</p>
                    </div>
                  )}
                  {(artistBasicInfo.birthCity ||
                    artistBasicInfo.birthCountry ||
                    artistBasicInfo.beginArea) && (
                    <div>
                      <label className="text-xs text-chino/70 uppercase">
                        Born In
                      </label>
                      <p className="text-cream">
                        {[
                          artistBasicInfo.birthCity,
                          artistBasicInfo.birthCountry,
                          artistBasicInfo.beginArea,
                        ]
                          .filter(Boolean)
                          .join(", ") || "N/A"}
                      </p>
                    </div>
                  )}
                  {artistBasicInfo.area && (
                    <div>
                      <label className="text-xs text-chino/70 uppercase">
                        Area
                      </label>
                      <p className="text-cream">{artistBasicInfo.area}</p>
                    </div>
                  )}
                </div>

                {/* Genres */}
                {artistBasicInfo.genres &&
                  artistBasicInfo.genres.length > 0 && (
                    <div>
                      <label className="text-xs text-chino/70 uppercase">
                        Genres (Click to Select)
                      </label>
                      <p className="text-[10px] text-chino/60 mb-2">
                        Select genres you want to add to the artist profile
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {artistBasicInfo.genres.map((genre, idx) => (
                          <button
                            key={idx}
                            onClick={() => toggleGenreSelection(genre)}
                            className={`px-3 py-1 text-xs rounded-full transition-all ${
                              selectedGenres.has(genre)
                                ? "bg-gold text-black font-bold"
                                : "bg-gold/20 text-gold hover:bg-gold/30"
                            }`}
                          >
                            {genre}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                {/* External Links */}
                {artistBasicInfo.externalLinks &&
                  Object.keys(artistBasicInfo.externalLinks).length > 0 && (
                    <div>
                      <label className="text-xs text-chino/70 uppercase">
                        External Links
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-2">
                        {artistBasicInfo.externalLinks.instagram && (
                          <a
                            href={artistBasicInfo.externalLinks.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 bg-pink-500/20 text-pink-400 hover:bg-pink-500/30 text-xs rounded flex items-center gap-2"
                          >
                            Instagram
                          </a>
                        )}
                        {artistBasicInfo.externalLinks.facebook && (
                          <a
                            href={artistBasicInfo.externalLinks.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 text-xs rounded flex items-center gap-2"
                          >
                            Facebook
                          </a>
                        )}
                        {artistBasicInfo.externalLinks.spotify && (
                          <a
                            href={artistBasicInfo.externalLinks.spotify}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 text-xs rounded flex items-center gap-2"
                          >
                            Spotify
                          </a>
                        )}
                        {artistBasicInfo.externalLinks.soundcloud && (
                          <a
                            href={artistBasicInfo.externalLinks.soundcloud}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 text-xs rounded flex items-center gap-2"
                          >
                            SoundCloud
                          </a>
                        )}
                        {artistBasicInfo.externalLinks.appleMusic && (
                          <a
                            href={artistBasicInfo.externalLinks.appleMusic}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 bg-gray-500/20 text-gray-300 hover:bg-gray-500/30 text-xs rounded flex items-center gap-2"
                          >
                            Apple Music
                          </a>
                        )}
                        {artistBasicInfo.externalLinks.residentAdvisor && (
                          <a
                            href={artistBasicInfo.externalLinks.residentAdvisor}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 text-xs rounded flex items-center gap-2"
                          >
                            Resident Advisor
                          </a>
                        )}
                        {artistBasicInfo.externalLinks.beatport && (
                          <a
                            href={artistBasicInfo.externalLinks.beatport}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 text-xs rounded flex items-center gap-2"
                          >
                            Beatport
                          </a>
                        )}
                        {artistBasicInfo.externalLinks.youtube && (
                          <a
                            href={artistBasicInfo.externalLinks.youtube}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs rounded flex items-center gap-2"
                          >
                            YouTube
                          </a>
                        )}
                        {artistBasicInfo.externalLinks.homepage && (
                          <a
                            href={artistBasicInfo.externalLinks.homepage}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 bg-gold/20 text-gold hover:bg-gold/30 text-xs rounded flex items-center gap-2"
                          >
                            Official Website
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                {/* Insert Artist Button */}
                <div className="pt-4 border-t border-gold/30">
                  <Button
                    text={isInsertingArtist ? "Inserting..." : "INSERT ARTIST"}
                    onClick={handleInsertArtist}
                    disabled={isInsertingArtist}
                    className="w-full bg-green-500/30 hover:bg-green-500/40 disabled:bg-gray-600"
                  />
                  <p className="text-[10px] text-chino/60 mt-2 text-center">
                    {selectedGenres.size > 0
                      ? `Will insert with ${selectedGenres.size} selected genre(s)`
                      : "No genres selected"}
                  </p>
                </div>
              </div>
            )}

            {/* Albums Section */}
            <div className="flex items-center justify-between bg-stone-900 border border-gold/30 p-4 rounded">
              <div>
                <Title
                  text={`Albums for: ${selectedArtist.stage_name || selectedArtist.name}`}
                />
                <Paragraph
                  text="Click on individual albums to import, or import all at once"
                  color="chino"
                />
              </div>
              <div className="flex gap-2">
                {albums.length > 0 && (
                  <>
                    {selectMode ? (
                      <>
                        <button
                          onClick={handleImportSelected}
                          disabled={
                            selectedAlbums.size === 0 || isImportingSelected
                          }
                          className="bg-green-500/30 hover:bg-green-500/40 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 font-bold flex items-center gap-2 rounded text-sm"
                        >
                          {isImportingSelected ? (
                            <>
                              <FaClock className="animate-spin" /> Importing (
                              {selectedAlbums.size})...
                            </>
                          ) : (
                            <>
                              <FaDownload /> Import Selected (
                              {selectedAlbums.size})
                            </>
                          )}
                        </button>
                        <button
                          onClick={toggleSelectMode}
                          disabled={isImportingSelected}
                          className="bg-gray-600 hover:bg-gray-700 disabled:cursor-not-allowed px-4 py-2 font-bold rounded text-sm"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={toggleSelectMode}
                          disabled={importingAlbumId !== null}
                          className="bg-blue-500/30 hover:bg-blue-500/40 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 font-bold flex items-center gap-2 rounded text-sm"
                        >
                          <FaCheckCircle /> Select Multiple
                        </button>
                        <button
                          onClick={handleImportAll}
                          disabled={
                            importingAlbumId !== null ||
                            albums.every(
                              (a) =>
                                a.alreadyImported || importedAlbums.has(a.id)
                            )
                          }
                          className="bg-gold/30 hover:bg-gold/40 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 font-bold flex items-center gap-2 rounded text-sm"
                        >
                          <SiMusicbrainz /> Import All New Albums
                        </button>
                        <button
                          onClick={handleDemoBulkImport}
                          className="bg-purple-500/30 hover:bg-purple-500/40 px-4 py-2 font-bold flex items-center gap-2 rounded text-sm"
                        >
                          <SiMusicbrainz /> Demo: Bulk API
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            {isLoadingAlbums && (
              <div className="center py-12 bg-stone-900 border border-gold/30 rounded">
                <Spinner type="logo" />
                <Paragraph
                  text="Fetching albums from MusicBrainz..."
                  color="chino"
                  className="mt-4"
                />
              </div>
            )}

            {!isLoadingAlbums && albums.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {albums.map((album) => {
                  const isImported =
                    album.alreadyImported || importedAlbums.has(album.id);
                  const isImporting = importingAlbumId === album.id;

                  return (
                    <div
                      key={album.id}
                      className={`bg-stone-900 border p-4 transition-all relative ${isImported ? "border-green-500/30 bg-green-900/10" : selectedAlbums.has(album.id) ? "border-blue-500 bg-blue-900/10" : "border-gold/30 hover:border-gold"}`}
                    >
                      {selectMode && !isImported && (
                        <div
                          onClick={() => toggleAlbumSelection(album.id)}
                          className={`absolute w-3 h-3 border top-2 right-2 z-10 cursor-pointer flex items-center justify-center transition-colors ${selectedAlbums.has(album.id) ? "bg-gold/80 " : "bg-stone-800 border-gold/30 hover:border-gold"}`}
                        >
                          {selectedAlbums.has(album.id) && (
                            <FaCheck className="text-white text-[8px]" />
                          )}
                        </div>
                      )}

                      <div className="flex items-start gap-3">
                        <div className="w-16 h-16 bg-stone-800 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {album.albumImage ? (
                            <Image
                              src={album.albumImage}
                              alt={album.title}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <SiMusicbrainz className="text-gold text-2xl" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Title
                            text={album.title}
                            size="sm"
                            className="truncate"
                          />
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-chino/70">
                              {album.primaryType}
                            </span>
                            {album.releaseDate && (
                              <>
                                <span className="text-chino/50">•</span>
                                <span className="text-xs text-chino/70">
                                  {new Date(album.releaseDate).getFullYear()}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        {isImported ? (
                          <div className="flex items-center justify-center gap-2 text-green-500 text-sm py-2">
                            <FaCheckCircle /> Already Imported
                          </div>
                        ) : (
                          <button
                            onClick={() => handleImportAlbum(album)}
                            disabled={
                              isImporting ||
                              importingAlbumId !== null ||
                              selectMode
                            }
                            className="w-full bg-gold/20 hover:bg-gold/30 disabled:bg-gray-700 disabled:cursor-not-allowed py-2 px-4 rounded text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                          >
                            {isImporting ? (
                              <>
                                <FaClock className="animate-spin" />{" "}
                                Importing...
                              </>
                            ) : (
                              <>
                                <FaDownload /> Import Album
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!isLoadingAlbums && albums.length === 0 && (
              <div className="bg-stone-900 border border-gold/30 p-8 text-center rounded">
                <Paragraph
                  text="No albums found on MusicBrainz for this artist"
                  color="chino"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
