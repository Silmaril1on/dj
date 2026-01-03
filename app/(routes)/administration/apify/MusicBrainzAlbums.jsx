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

  // MusicBrainz states
  const [searchTerm, setSearchTerm] = useState("");
  const [artists, setArtists] = useState([]);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [albums, setAlbums] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingAlbums, setIsLoadingAlbums] = useState(false);
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

    try {
      const url = `/api/automation/search-artists?q=${encodeURIComponent(
        trimmedSearch
      )}`;
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
    setIsLoadingAlbums(true);

    try {
      const url = `/api/automation/artist-album/preview-albums?artistId=${artist.id}`;
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

  if (!user?.is_admin) {
    return (
      <div className="min-h-screen bg-black p-8 flex items-center justify-center">
        <p className="text-cream text-xl">Access denied. Admin only.</p>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="bg-neutral-900 border border-gold/30 p-6 mb-6">
        <div className="mb-4">
          <label className="block text-sm font-bold uppercase text-cream ">
            Search MusicBrainz
          </label>
          <p className="secondary text-[10px] mb-2">
            Import artist albums from musicbrainz
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search for artist (e.g., Martin Garrix)"
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
            {artists.map((artist) => (
              <button
                key={artist.id}
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
