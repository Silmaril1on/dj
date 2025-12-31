"use client";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectUser } from "@/app/features/userSlice";
import { setError } from "@/app/features/modalSlice";
import SectionContainer from "@/app/components/containers/SectionContainer";
import Spinner from "@/app/components/ui/Spinner";
import Title from "@/app/components/ui/Title";
import Paragraph from "@/app/components/ui/Paragraph";
import { FaSearch, FaCheckCircle, FaDownload, FaClock } from "react-icons/fa";
import { SiMusicbrainz } from "react-icons/si";
import Image from "next/image";
import Button from "@/app/components/buttons/Button";

const AlbumAutomationPage = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
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

  // API Response Demonstration State
  const [apiResponses, setApiResponses] = useState({
    preview: null,
    singleImport: null,
    bulkImport: null,
  });
  const [showApiDemo, setShowApiDemo] = useState({
    preview: false,
    singleImport: false,
    bulkImport: false,
  });

  const handleSearch = async () => {
    const trimmedSearch = searchTerm.trim();

    if (!trimmedSearch) {
      return;
    }

    setIsSearching(true);
    setSelectedArtist(null);
    setAlbums([]);

    try {
      const url = `/api/automation/search-artists?q=${encodeURIComponent(trimmedSearch)}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.results) {
        const artistResults = data.results;
        setArtists(artistResults);
      } else {
        setArtists([]);
      }
    } catch (error) {
      setArtists([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleSelectArtist = async (artist) => {
    setSelectedArtist(artist);
    setAlbums([]);
    setImportedAlbums(new Set());
    setIsLoadingAlbums(true);

    try {
      const url = `/api/automation/preview-albums?artistId=${artist.id}`;
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
    } catch (error) {
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
      const response = await fetch("/api/automation/import-single-album", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          artistId: selectedArtist.id,
          album: album,
        }),
      });

      const data = await response.json();
      setApiResponses((prev) => ({ ...prev, singleImport: data }));

      if (response.ok && data.success) {
        dispatch(
          setError({
            message: data.message,
            type: "success",
          })
        );
        setImportedAlbums((prev) => new Set([...prev, album.id]));
      } else {
        dispatch(
          setError({
            message: data.error || "Failed to import album",
            type: "error",
          })
        );
      }
    } catch (error) {
      dispatch(
        setError({
          message: "Failed to import album",
          type: "error",
        })
      );
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
    setSelectedAlbums(new Set()); // Clear selections when toggling mode
  };

  const toggleAlbumSelection = (albumId) => {
    setSelectedAlbums((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(albumId)) {
        newSet.delete(albumId);
      } else {
        newSet.add(albumId);
      }
      return newSet;
    });
  };

  const handleImportSelected = async () => {
    if (selectedAlbums.size === 0) return;

    setIsImportingSelected(true);
    const albumsToImport = albums.filter((a) => selectedAlbums.has(a.id));

    for (const album of albumsToImport) {
      await handleImportAlbum(album);
    }

    setIsImportingSelected(false);
    setSelectedAlbums(new Set()); // Clear selections after import
    setSelectMode(false); // Exit select mode
  };

  // Demonstration: Call bulk import API (doesn't use it in normal flow)
  const handleDemoBulkImport = async () => {
    if (!selectedArtist) return;

    try {
      const response = await fetch("/api/automation/import-albums", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          artistId: selectedArtist.id,
        }),
      });

      const data = await response.json();
      setApiResponses((prev) => ({ ...prev, bulkImport: data }));

      if (data.success) {
        dispatch(
          setError({
            message: data.message,
            type: "success",
          })
        );
        handleSelectArtist(selectedArtist);
      }
    } catch (error) {
      // Handle error silently or show user error
    }
  };

  if (!user?.is_admin) {
    return (
      <div className="min-h-screen center">
        <Title text="Access Denied" />
        <Paragraph text="Admin access required" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <SectionContainer
        title="Album Import Automation"
        description="Import artist albums from MusicBrainz - Search, preview, and import individual albums"
        className="w-full"
      >
        <div className=" w-full">
          {/* Search Section */}
          <div className="space-y-2 w-full">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search for artist (e.g., Martin Garrix, Armin van Buuren)..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                }}
                onKeyPress={handleKeyPress}
              />
              <Button
                text="Search"
                icon={isSearching ? <Spinner type="simple" /> : <FaSearch />}
                onClick={() => {
                  handleSearch();
                }}
                disabled={isSearching || !searchTerm.trim()}
              />
            </div>

            {/* Search Results */}
            {artists.length > 0 && (
              <div className="bg-stone-900 border border-gold/30 max-h-96 overflow-y-auto">
                <div className="divide-y divide-gold/20">
                  {artists.map((artist) => (
                    <div
                      key={artist.id}
                      onClick={() => handleSelectArtist(artist)}
                      className={`p-3 cursor-pointer hover:bg-gold/10 transition-colors ${
                        selectedArtist?.id === artist.id ? "bg-gold/20" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Image
                          src={artist.artist_image || "/default-artist.png"}
                          alt={artist.name}
                          width={48}
                          height={48}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="flex-1">
                          <Title
                            text={artist.stage_name || artist.name}
                            size="sm"
                          />
                          <Paragraph
                            text={`${artist.country || "Unknown"} • ${artist.genres?.[0] || "No genre"}`}
                            size="sm"
                            color="chino"
                          />
                        </div>
                        {artist.musicbrainz_artist_id && (
                          <span className="text-xs text-green-500 flex items-center gap-1">
                            <FaCheckCircle /> MusicBrainz ID
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isSearching && (
              <div className="center py-8">
                <Spinner type="logo" />
                <Paragraph text="Searching artists..." color="chino" />
              </div>
            )}

            {!isSearching && searchTerm && artists.length === 0 && (
              <div className="bg-stone-900 border border-gold/30 p-8 text-center rounded">
                <Paragraph
                  text="No artists found. Try a different search term."
                  color="chino"
                />
              </div>
            )}
          </div>
          {/* Albums Section */}
          {selectedArtist && (
            <div className="mt-8 space-y-4">
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
                        className={`bg-stone-900 border p-4 rounded transition-all relative ${
                          isImported
                            ? "border-green-500/30 bg-green-900/10"
                            : selectedAlbums.has(album.id)
                              ? "border-blue-500 bg-blue-900/10"
                              : "border-gold/30 hover:border-gold"
                        }`}
                      >
                        {/* Checkbox in Select Mode */}
                        {selectMode && !isImported && (
                          <div className="absolute top-2 right-2 z-10">
                            <input
                              type="checkbox"
                              checked={selectedAlbums.has(album.id)}
                              onChange={() => toggleAlbumSelection(album.id)}
                              className="w-5 h-5 cursor-pointer accent-blue-500"
                            />
                          </div>
                        )}

                        {/* Album Cover or Icon */}
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

          {/* Instructions */}
          <div className="mt-8 bg-stone-900/50 border border-gold/50 p-4 text-sm rounded">
            <Title text="How it works:" size="sm" className="mb-2" />
            <ul className="list-disc list-inside space-y-1 text-chino/80">
              <li>Search for an artist by name (e.g., Martin Garrix)</li>
              <li>Select the artist from the search results</li>
              <li>Browse the list of albums fetched from MusicBrainz</li>
              <li>
                Click Import Album on individual albums or Import All to import
                all new albums
              </li>
              <li>Already imported albums are marked with a green checkmark</li>
              <li>
                System automatically excludes singles, compilations, and live
                albums
              </li>
              <li>
                Rate limiting is applied automatically (1 request per second)
              </li>
            </ul>
          </div>
        </div>
      </SectionContainer>
    </div>
  );
};

export default AlbumAutomationPage;
