"use client";
import React, { useState } from "react";
import Button from "@/app/components/buttons/Button";
import Spinner from "@/app/components/ui/Spinner";
import Title from "@/app/components/ui/Title";
import Paragraph from "@/app/components/ui/Paragraph";
import { useDispatch, useSelector } from "react-redux";
import { setError } from "@/app/features/modalSlice";
import { selectUser } from "@/app/features/userSlice";

const RaArtists = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [raData, setRaData] = useState(null);
  const [mbData, setMbData] = useState(null);
  const [mergedData, setMergedData] = useState(null);
  const [error, setErrorState] = useState(null);
  const [isInserting, setIsInserting] = useState(false);
  const [insertSuccess, setInsertSuccess] = useState(null);
  const [selectedGenres, setSelectedGenres] = useState(new Set());

  const handleFetchArtist = async () => {
    const trimmedSearch = searchTerm.trim();
    if (!trimmedSearch) {
      setErrorState("Please enter an artist name or RA URL");
      return;
    }

    setLoading(true);
    setErrorState(null);
    setRaData(null);
    setMbData(null);
    setMergedData(null);
    setInsertSuccess(null);
    setSelectedGenres(new Set());

    try {
      // Determine if it's a URL or artist name
      const isUrl = trimmedSearch.startsWith("http");
      const searchUrl = isUrl
        ? trimmedSearch
        : `https://ra.co/dj/${trimmedSearch.toLowerCase().replace(/\s+/g, "")}`;

      // Fetch from RA
      console.log("🎵 Fetching from RA:", searchUrl);
      const raResponse = await fetch("/api/apify/ra-artists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: searchUrl }),
      });

      const raResult = await raResponse.json();
      console.log("🎵 RA Artist Response:", raResult);

      if (!raResponse.ok) {
        throw new Error(raResult.error || "Failed to fetch artist from RA");
      }

      setRaData(raResult.data);

      // Search for artist in MusicBrainz
      const artistName =
        raResult.data?.artistName || raResult.data?.name || trimmedSearch;
      console.log("🎵 Searching MusicBrainz for:", artistName);

      let fetchedMbData = null;

      try {
        const mbSearchResponse = await fetch(
          `/api/automation/artist-album/search-musicbrainz?q=${encodeURIComponent(artistName)}`
        );

        if (!mbSearchResponse.ok) {
          console.warn(
            "⚠️ MusicBrainz search failed:",
            mbSearchResponse.status
          );
        } else {
          const mbSearchResult = await mbSearchResponse.json();
          console.log("🎵 MusicBrainz search result:", mbSearchResult);

          if (mbSearchResult.results && mbSearchResult.results.length > 0) {
            // Find best match by comparing artist names
            const searchLower = artistName.toLowerCase().trim();
            const mbArtist =
              mbSearchResult.results.find((result) => {
                const nameLower = (result.name || "").toLowerCase().trim();
                const stageNameLower = (result.stage_name || "")
                  .toLowerCase()
                  .trim();
                return (
                  nameLower === searchLower || stageNameLower === searchLower
                );
              }) || mbSearchResult.results[0]; // Fallback to first if no exact match

            console.log("🎵 Found MusicBrainz artist:", mbArtist);

            // Fetch detailed info from MusicBrainz
            try {
              const mbInfoResponse = await fetch(
                `/api/automation/artist-album/artist-basic-info?mbid=${mbArtist.musicbrainz_id}`
              );

              if (mbInfoResponse.ok) {
                const mbInfoResult = await mbInfoResponse.json();

                if (mbInfoResult.success) {
                  fetchedMbData = mbInfoResult.data;
                  setMbData(mbInfoResult.data);
                  console.log("🎵 MusicBrainz Info:", mbInfoResult.data);

                  // Auto-select genres from MusicBrainz
                  if (
                    mbInfoResult.data.genres &&
                    mbInfoResult.data.genres.length > 0
                  ) {
                    setSelectedGenres(new Set(mbInfoResult.data.genres));
                  }
                } else {
                  console.warn(
                    "⚠️ MusicBrainz info fetch unsuccessful:",
                    mbInfoResult
                  );
                }
              } else {
                console.warn(
                  "⚠️ MusicBrainz artist info failed:",
                  mbInfoResponse.status
                );
              }
            } catch (mbInfoError) {
              console.warn(
                "⚠️ Error fetching MusicBrainz artist info:",
                mbInfoError.message
              );
            }
          } else {
            console.log("ℹ️ No MusicBrainz results found for:", artistName);
          }
        }
      } catch (mbError) {
        console.warn(
          "⚠️ MusicBrainz search error (continuing with RA data only):",
          mbError.message
        );
      }

      // Merge data
      mergeFetchedData(raResult.data, fetchedMbData);
    } catch (err) {
      console.error("Error:", err);
      setErrorState(err.message);
    } finally {
      setLoading(false);
    }
  };

  const mergeFetchedData = (ra, mb) => {
    // Get real name from RA firstName + lastName (only if both are non-empty strings)
    const raRealName =
      ra?.firstName && ra?.lastName && ra.firstName.trim() && ra.lastName.trim()
        ? `${ra.firstName} ${ra.lastName}`.trim()
        : null;

    // Get labels from RA artistLabels
    const raLabels = ra?.artistLabels
      ? ra.artistLabels.map((label) => label.labelName).filter(Boolean)
      : [];

    // Filter MusicBrainz links to only allowed platforms
    const allowedPlatforms = [
      "facebook",
      "soundcloud",
      "twitter",
      "beatport",
      "appleMusic",
      "instagram",
      "youtube",
      "spotify",
    ];
    const mbSocialLinks = mb?.externalLinks
      ? Object.entries(mb.externalLinks)
          .filter(([key, value]) => allowedPlatforms.includes(key) && value)
          .map(([key, value]) => value)
      : [];

    // artists.stage_name = artistName from RA (RA always has artistName)
    const finalStageName = ra?.artistName || mb?.stageName || mb?.name;

    // artists.name = Real name (firstName + lastName from RA, or MusicBrainz legalName if RA doesn't provide)
    let finalRealName = raRealName; // Try RA first
    if (!finalRealName && mb) {
      // If RA didn't provide firstName/lastName, use MusicBrainz legalName
      finalRealName =
        mb.legalName || (mb.name !== mb.stageName ? mb.name : null);
    }
    // If still no real name, use stage name as fallback
    if (!finalRealName) {
      finalRealName = finalStageName;
    }

    // Validate birth date - only accept full dates (YYYY-MM-DD), not just years
    const birthDate = mb?.birthDate || null;
    const validBirthDate =
      birthDate && birthDate.match(/^\d{4}-\d{2}-\d{2}$/) ? birthDate : null;

    const merged = {
      // artists.name = Real/legal name (firstName + lastName from RA, or MusicBrainz legalName)
      name: finalRealName || null,
      // artists.stage_name = Artist/performance name (artistName from RA)
      stage_name: finalStageName || null,

      // From RA
      bio: ra?.bio || null,
      desc: ra?.blurb || null, // artists.desc = blurb from RA
      artist_image: ra?.image || null, // Only from RA
      label: raLabels.length > 0 ? raLabels : [], // artists.label from RA artistLabels

      // From MusicBrainz (specific fields)
      sex: mb?.gender || null,
      birth: validBirthDate,
      country: mb?.country || null,
      city: mb?.birthCity || mb?.beginArea || null,
      musicbrainz_artist_id: mb?.mbid || null,

      // Social links - from MusicBrainz only
      social_links: mbSocialLinks,

      // Genres from MusicBrainz
      genres: mb?.genres || [],

      // Additional data
      realName: finalRealName, // Same as name field
      followers: ra?.followers || null,
      charts: ra?.charts || null,
    };

    console.log("🎵 MERGED DATA FOR INSERTION:", merged);
    console.log("📊 Data Sources:", {
      "artists.name (real name)": finalRealName
        ? raRealName
          ? "RA (firstName + lastName)"
          : "MusicBrainz (legalName)"
        : "None",
      "artists.stage_name": finalStageName
        ? ra?.artistName
          ? "RA (artistName)"
          : "MusicBrainz (stageName)"
        : "None",
      "artists.desc (blurb)": ra?.blurb ? "RA" : "None",
      "artists.label":
        raLabels.length > 0 ? `RA (${raLabels.length} labels)` : "None",
      bio: ra?.bio ? "RA" : "None",
      gender: mb?.gender ? "MusicBrainz" : "None",
      birthDate: mb?.birthDate ? "MusicBrainz" : "None",
      location: mb?.country || mb?.city ? "MusicBrainz" : "None",
      genres: mb?.genres?.length > 0 ? "MusicBrainz" : "None",
      socialLinks: `MB: ${mbSocialLinks.length}, Total: ${merged.social_links.length}`,
    });
    setMergedData(merged);
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
    if (!mergedData) {
      setErrorState("No artist data to insert");
      return;
    }

    const selectedGenresArray = Array.from(selectedGenres);
    const finalInsertionData = {
      ...mergedData,
      genres: selectedGenresArray,
    };

    console.log("💾 FINAL INSERTION DATA:", finalInsertionData);

    setIsInserting(true);
    setErrorState(null);
    setInsertSuccess(null);

    try {
      const response = await fetch(
        "/api/automation/artist-album/insert-merged-artist",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(finalInsertionData),
        }
      );

      const data = await response.json();
      console.log("💾 Insert Response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to insert artist");
      }

      setInsertSuccess(data.message);
      dispatch(
        setError({
          message: "Artist inserted successfully!",
          type: "success",
        })
      );
    } catch (err) {
      console.error("Insert Error:", err);
      setErrorState(err.message);
      dispatch(setError({ message: err.message, type: "error" }));
    } finally {
      setIsInserting(false);
    }
  };

  const renderValue = (value, key = "") => {
    if (value === null || value === undefined) {
      return <span className="text-gray-500">null</span>;
    }

    if (typeof value === "boolean") {
      return <span className="text-purple-400">{String(value)}</span>;
    }

    if (typeof value === "number") {
      return <span className="text-yellow-400">{value}</span>;
    }

    if (typeof value === "string") {
      // Check if it's a URL
      if (value.startsWith("http://") || value.startsWith("https://")) {
        return (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            {value}
          </a>
        );
      }
      return <span className="text-green-400">"{value}"</span>;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-gray-500">[]</span>;
      }
      return (
        <div className="ml-4">
          <span className="text-gray-400">[</span>
          {value.map((item, index) => (
            <div key={index} className="ml-4">
              <span className="text-gray-500">{index}: </span>
              {renderValue(item)}
              {index < value.length - 1 && (
                <span className="text-gray-400">,</span>
              )}
            </div>
          ))}
          <span className="text-gray-400">]</span>
        </div>
      );
    }

    if (typeof value === "object") {
      const entries = Object.entries(value);
      if (entries.length === 0) {
        return <span className="text-gray-500">{"{}"}</span>;
      }
      return (
        <div className="ml-4">
          <span className="text-gray-400">{"{"}</span>
          {entries.map(([k, v], index) => (
            <div key={k} className="ml-4">
              <span className="text-cyan-400">"{k}"</span>
              <span className="text-gray-400">: </span>
              {renderValue(v, k)}
              {index < entries.length - 1 && (
                <span className="text-gray-400">,</span>
              )}
            </div>
          ))}
          <span className="text-gray-400">{"}"}</span>
        </div>
      );
    }

    return <span className="text-gray-300">{String(value)}</span>;
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
      {/* Search Section */}
      <div className="bg-neutral-900 border border-gold/30 p-6">
        <Title text="Merged RA + MusicBrainz Artist Scraper" />
        <Paragraph
          text="Enter an artist name or RA URL (e.g., 'Armin van Buuren' or 'https://ra.co/dj/arminvanbuuren')"
          color="chino"
          className="mb-4"
        />

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleFetchArtist()}
            placeholder="Artist name or RA URL..."
            className="flex-1 px-4 py-2 bg-black border border-gold/30 text-cream focus:outline-none focus:border-gold"
            disabled={loading}
          />
          <Button
            text={loading ? "Fetching..." : "Fetch Artist"}
            onClick={handleFetchArtist}
            disabled={loading}
          />
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500 p-4 text-red-300">
            {error}
          </div>
        )}

        {insertSuccess && (
          <div className="bg-green-900/20 border border-green-500 p-4 text-green-300">
            {insertSuccess}
          </div>
        )}
      </div>

      {loading && (
        <div className="bg-neutral-900 border border-gold/30 p-12 flex flex-col items-center justify-center">
          <Spinner type="logo" />
          <Paragraph
            text="Fetching artist data from RA and MusicBrainz..."
            color="chino"
            className="mt-4"
          />
          <p className="text-cream-600 text-sm mt-2">
            This may take up to 2-3 minutes
          </p>
        </div>
      )}

      {/* Merged Artist Info Section */}
      {mergedData && (
        <div className="bg-stone-900 border border-gold/30 p-6 rounded space-y-4">
          <div className="flex items-center justify-between">
            <Title text="Merged Artist Information" />
            <div className="flex gap-2 text-xs">
              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                RA Data
              </span>
              <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded">
                MusicBrainz Data
              </span>
            </div>
          </div>

          {/* Artist Image */}
          {mergedData.artist_image && (
            <div className="flex justify-center">
              <Image
                src={mergedData.artist_image}
                alt={mergedData.name}
                width={200}
                height={200}
                className="rounded-lg object-cover"
                unoptimized
              />
            </div>
          )}

          {/* Artist Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-chino/70 uppercase">
                Artist Name
              </label>
              <p className="text-cream font-semibold">
                {mergedData.stage_name}
              </p>
              <span className="text-[10px] text-blue-400">From RA</span>
            </div>

            {mergedData.realName && (
              <div>
                <label className="text-xs text-chino/70 uppercase">
                  Real Name
                </label>
                <p className="text-cream font-semibold">
                  {mergedData.realName}
                </p>
                <span className="text-[10px] text-blue-400">From RA</span>
              </div>
            )}

            {mergedData.sex && (
              <div>
                <label className="text-xs text-chino/70 uppercase">
                  Gender
                </label>
                <p className="text-cream capitalize">{mergedData.sex}</p>
                <span className="text-[10px] text-purple-400">
                  From MusicBrainz
                </span>
              </div>
            )}

            {mergedData.birth && (
              <div>
                <label className="text-xs text-chino/70 uppercase">Born</label>
                <p className="text-cream">{mergedData.birth}</p>
                <span className="text-[10px] text-purple-400">
                  From MusicBrainz
                </span>
              </div>
            )}

            {(mergedData.city || mergedData.country) && (
              <div>
                <label className="text-xs text-chino/70 uppercase">
                  Location
                </label>
                <p className="text-cream">
                  {[mergedData.city, mergedData.country]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                <span className="text-[10px] text-purple-400">
                  From MusicBrainz
                </span>
              </div>
            )}

            {mergedData.followers && (
              <div>
                <label className="text-xs text-chino/70 uppercase">
                  Followers
                </label>
                <p className="text-cream">{mergedData.followers}</p>
                <span className="text-[10px] text-blue-400">From RA</span>
              </div>
            )}
          </div>

          {/* Bio */}
          {mergedData.bio && (
            <div>
              <label className="text-xs text-chino/70 uppercase">
                Biography
              </label>
              <p className="text-cream text-sm mt-2">{mergedData.bio}</p>
              <span className="text-[10px] text-blue-400">From RA</span>
            </div>
          )}

          {/* Labels */}
          {mergedData.label && mergedData.label.length > 0 && (
            <div>
              <label className="text-xs text-chino/70 uppercase">Labels</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {mergedData.label.map((labelName, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 text-xs rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30"
                  >
                    {labelName}
                  </span>
                ))}
              </div>
              <span className="text-[10px] text-blue-400 block mt-2">
                From RA
              </span>
            </div>
          )}

          {/* Genres */}
          {mergedData.genres && mergedData.genres.length > 0 && (
            <div>
              <label className="text-xs text-chino/70 uppercase">
                Genres (Click to Select/Deselect)
              </label>
              <p className="text-[10px] text-chino/60 mb-2">
                Select genres you want to add to the artist profile
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {mergedData.genres.map((genre, idx) => (
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
              <span className="text-[10px] text-purple-400 block mt-2">
                From MusicBrainz
              </span>
            </div>
          )}

          {/* Social Links */}
          {mergedData.social_links && mergedData.social_links.length > 0 && (
            <div>
              <label className="text-xs text-chino/70 uppercase">
                Social Links
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-2">
                {mergedData.social_links.map((link, idx) => {
                  const domain = new URL(link).hostname.replace("www.", "");
                  const platformName =
                    domain.split(".")[0].charAt(0).toUpperCase() +
                    domain.split(".")[0].slice(1);

                  return (
                    <a
                      key={idx}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-gold/20 text-gold hover:bg-gold/30 text-xs rounded flex items-center gap-2 truncate"
                    >
                      {platformName}
                    </a>
                  );
                })}
              </div>
              <span className="text-[10px] text-purple-400 block mt-2">
                From RA + MusicBrainz (merged)
              </span>
            </div>
          )}

          {/* Insert Artist Button */}
          <div className="pt-4 border-t border-gold/30">
            <Button
              text={isInserting ? "Inserting..." : "INSERT ARTIST TO DATABASE"}
              onClick={handleInsertArtist}
              disabled={isInserting}
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

      {/* Raw JSON Data Section */}
      {(raData || mbData) && (
        <div className="bg-neutral-900 border border-gold/30 p-6">
          <Title text="Raw Data (for debugging)" size="sm" />

          {raData && (
            <div className="mb-4">
              <h4 className="text-sm font-bold text-blue-400 mb-2">RA Data:</h4>
              <div className="bg-black p-4 rounded overflow-x-auto max-h-96">
                <pre className="text-sm font-mono whitespace-pre-wrap">
                  {renderValue(raData)}
                </pre>
              </div>
            </div>
          )}

          {mbData && (
            <div>
              <h4 className="text-sm font-bold text-purple-400 mb-2">
                MusicBrainz Data:
              </h4>
              <div className="bg-black p-4 rounded overflow-x-auto max-h-96">
                <pre className="text-sm font-mono whitespace-pre-wrap">
                  {renderValue(mbData)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RaArtists;
