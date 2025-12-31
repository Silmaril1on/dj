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

    console.log("═══════════════════════════════════════════");
    console.log("🔍 FRONTEND: handleSearch called");
    console.log("═══════════════════════════════════════════");
    console.log("📝 Search term RAW:", searchTerm);
    console.log("📝 Search term TRIMMED:", trimmedSearch);
    console.log("📝 Search term LENGTH:", trimmedSearch.length);
    console.log("📝 Search term TYPE:", typeof trimmedSearch);

    if (!trimmedSearch) {
      console.log("❌ Search term is empty, returning");
      return;
    }

    console.log("✅ Starting database search for artists:", trimmedSearch);
    setIsSearching(true);
    setSelectedArtist(null);
    setAlbums([]);

    try {
      // Search YOUR database artists table
      const url = `/api/automation/search-artists?q=${encodeURIComponent(trimmedSearch)}`;
      console.log("🌐 FETCHING URL:", url);
      console.log("🌐 Encoded search term:", encodeURIComponent(trimmedSearch));

      const response = await fetch(url);
      console.log("📡 RESPONSE STATUS:", response.status, response.statusText);
      console.log("📡 RESPONSE OK:", response.ok);
      console.log("📡 RESPONSE TYPE:", response.headers.get("content-type"));

      const data = await response.json();
      console.log("📦 FULL API RESPONSE:");
      console.log(JSON.stringify(data, null, 2));
      console.log("📊 Response data type:", typeof data);
      console.log("🔑 Response keys:", Object.keys(data));
      console.log("📊 Data source:", data.source);

      if (data.results) {
        console.log("✅ data.results EXISTS");
        console.log("📊 Results array length:", data.results.length);
        console.log("📋 All results (full array):");
        console.log(JSON.stringify(data.results, null, 2));

        // All results are already artists from YOUR database
        const artistResults = data.results;
        console.log("🎨 Artist results (from database):");
        console.log(JSON.stringify(artistResults, null, 2));
        console.log("🎨 Artist count FINAL:", artistResults.length);

        setArtists(artistResults);
        console.log(
          "✅ STATE UPDATED - Artists array length:",
          artistResults.length
        );
      } else {
        console.log("❌ NO results property in response");
        console.log("❌ Response structure:", Object.keys(data));
        setArtists([]);
      }
    } catch (error) {
      console.error("❌ Search error:", error);
      console.error("Error stack:", error.stack);
      setArtists([]);
    } finally {
      console.log("🏁 Search complete, setting isSearching to false");
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
      console.log("═══════════════════════════════════════════");
      console.log("🔵 API CALL #1: /api/automation/preview-albums");
      console.log("═══════════════════════════════════════════");
      console.log("📤 REQUEST - Artist data:", {
        endpoint: "/api/automation/preview-albums",
        method: "GET",
        artistId: artist.id,
        artistName: artist.stage_name || artist.name,
        hasMusicBrainzId: !!artist.musicbrainz_artist_id,
      });

      // Database artist - use artistId (already has ID from database)
      const url = `/api/automation/preview-albums?artistId=${artist.id}`;
      console.log("🌐 Fetching preview URL:", url);
      console.log("🌐 This will fetch albums from MusicBrainz for this artist");

      const response = await fetch(url);
      const data = await response.json();

      console.log("📥 RESPONSE STATUS:", response.status, response.statusText);
      console.log("📦 FULL DATA STRUCTURE:");
      console.log(JSON.stringify(data, null, 2));
      console.log("🔍 DATA BREAKDOWN:");
      console.log("  - success:", data.success);
      console.log("  - artist:", data.artist);
      console.log("  - albums count:", data.albums?.length);
      console.log("  - totalFound:", data.totalFound);
      console.log("  - alreadyImported:", data.alreadyImported);
      console.log("  - Sample album:", data.albums?.[0]);
      console.log("═══════════════════════════════════════════\n");

      // Store for UI display
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
      console.error("Error fetching albums:", error);
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
      console.log("═══════════════════════════════════════════");
      console.log("🟢 API CALL #2: /api/automation/import-single-album");
      console.log("═══════════════════════════════════════════");
      console.log("📤 REQUEST:", {
        endpoint: "/api/automation/import-single-album",
        method: "POST",
        artistId: selectedArtist.id,
        album: {
          id: album.id,
          title: album.title,
          releaseDate: album.releaseDate,
          primaryType: album.primaryType,
        },
      });

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

      console.log("📥 RESPONSE STATUS:", response.status, response.statusText);
      console.log("📦 FULL DATA STRUCTURE:");
      console.log(JSON.stringify(data, null, 2));
      console.log("🔍 DATA BREAKDOWN:");
      console.log("  - success:", data.success);
      console.log("  - message:", data.message);
      console.log("  - album.id:", data.album?.id);
      console.log("  - album.name:", data.album?.name);
      console.log("  - tracklist length:", data.album?.tracklist?.length);
      console.log("  - Sample tracks:", data.album?.tracklist?.slice(0, 3));
      console.log("═══════════════════════════════════════════\n");

      // Store for UI display
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
      console.error("Import error:", error);
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

  // Demonstration: Call bulk import API (doesn't use it in normal flow)
  const handleDemoBulkImport = async () => {
    if (!selectedArtist) return;

    try {
      console.log("═══════════════════════════════════════════");
      console.log("🟣 API CALL #3: /api/automation/import-albums");
      console.log("═══════════════════════════════════════════");
      console.log("📤 REQUEST:", {
        endpoint: "/api/automation/import-albums",
        method: "POST",
        artistId: selectedArtist.id,
        artistName: selectedArtist.stage_name || selectedArtist.name,
      });

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

      console.log("📥 RESPONSE STATUS:", response.status, response.statusText);
      console.log("📦 FULL DATA STRUCTURE:");
      console.log(JSON.stringify(data, null, 2));
      console.log("🔍 DATA BREAKDOWN:");
      console.log("  - success:", data.success);
      console.log("  - message:", data.message);
      console.log("  - imported:", data.imported);
      console.log("  - skipped:", data.skipped);
      console.log("  - totalFound:", data.totalFound);
      console.log("  - mbArtistId:", data.mbArtistId);
      console.log("  - mbArtistName:", data.mbArtistName);
      console.log("  - errors:", data.errors);
      console.log("═══════════════════════════════════════════\n");

      // Store for UI display
      setApiResponses((prev) => ({ ...prev, bulkImport: data }));

      if (data.success) {
        dispatch(
          setError({
            message: data.message,
            type: "success",
          })
        );
        // Refresh album list
        handleSelectArtist(selectedArtist);
      }
    } catch (error) {
      console.error("Bulk import error:", error);
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
        <div className="">
          {/* Search Section */}
          <div className="space-y-2 w-full max-w-[30%]">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search for artist (e.g., Martin Garrix, Armin van Buuren)..."
                value={searchTerm}
                onChange={(e) => {
                  console.log("🎯 Input changed:", e.target.value);
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
                      <button
                        onClick={handleImportAll}
                        disabled={
                          importingAlbumId !== null ||
                          albums.every(
                            (a) => a.alreadyImported || importedAlbums.has(a.id)
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
                        className={`bg-stone-900 border p-4 rounded transition-all ${
                          isImported
                            ? "border-green-500/30 bg-green-900/10"
                            : "border-gold/30 hover:border-gold"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 bg-stone-800 rounded flex items-center justify-center flex-shrink-0">
                            <SiMusicbrainz className="text-gold text-2xl" />
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
                                isImporting || importingAlbumId !== null
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
