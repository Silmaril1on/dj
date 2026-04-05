"use client";
import React, { useState } from "react";
import Button from "@/app/components/buttons/Button";
import Spinner from "@/app/components/ui/Spinner";
import Title from "@/app/components/ui/Title";
import Paragraph from "@/app/components/ui/Paragraph";
import { useDispatch, useSelector } from "react-redux";
import { setError } from "@/app/features/modalSlice";
import { selectUser } from "@/app/features/userSlice";

// --- Helpers ----------------------------------------------------------------

const ALLOWED_SOCIAL_KEYS = [
  "facebook",
  "soundcloud",
  "instagram",
  "twitter",
  "website",
];

function getSocialLinks(ra) {
  return ALLOWED_SOCIAL_KEYS.map((k) => ra[k]).filter(Boolean);
}

function getFullName(ra) {
  const first = (ra.firstName || "").trim();
  const last = (ra.lastName || "").trim();
  return first && last
    ? `${first} ${last}`
    : first || last || ra.artistName || "";
}

function buildInsertionPreview(ra) {
  const truncate = (str, len = 300) =>
    str && str.length > len ? str.substring(0, len) + "..." : str || null;
  return {
    stage_name: ra.artistName || null,
    name: getFullName(ra) || null,
    desc: truncate(ra.blurb),
    bio: truncate(ra.bio),
    status: "pending",
    artist_slug: ra.urlSafeName || null,
    social_links: getSocialLinks(ra),
    label: ra.artistLabels?.map((l) => l.labelName).filter(Boolean) || [],
    country: ra.artistAreas?.[0]?.countryUrl || null,
    city: ra.artistAreas?.[0]?.areaName || null,
    artist_image: ra.image || null,
  };
}

/** Collect unique related artists from an array of RA artist data objects. */
function collectRelatedPool(artistDataArray) {
  const seen = new Set();
  const pool = [];
  for (const artist of artistDataArray) {
    for (const rel of artist.relatedArtists || []) {
      if (rel.artistName && !seen.has(rel.artistName)) {
        seen.add(rel.artistName);
        pool.push(rel);
      }
    }
  }
  return pool;
}

// --- Component --------------------------------------------------------------

const RaArtists = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  const [searchTerms, setSearchTerms] = useState("");
  const [loading, setLoading] = useState(false);
  const [artists, setArtists] = useState([]);
  const [fetchError, setFetchError] = useState(null);

  // Main insert
  const [isInserting, setIsInserting] = useState(false);
  const [insertResults, setInsertResults] = useState(null);

  // Related artists: selectable pool + selection state
  const [relatedPool, setRelatedPool] = useState([]); // { artistId, artistName, url, followerCount }[]
  const [selectedRelated, setSelectedRelated] = useState(new Set());

  // Related fetch / check / insert pipeline
  const [relatedFetching, setRelatedFetching] = useState(false);
  // { fetched: [], toInsert: [], alreadyExist: [] }
  const [relatedFetchData, setRelatedFetchData] = useState(null);
  const [isInsertingRelated, setIsInsertingRelated] = useState(false);
  const [relatedInsertResults, setRelatedInsertResults] = useState(null);

  // -- Toggle related artist selection --------------------------------------
  const toggleRelated = (name) => {
    setSelectedRelated((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  // -- Fetch main artists ----------------------------------------------------
  const handleFetchArtists = async () => {
    const lines = searchTerms
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      setFetchError("Enter at least one RA artist URL");
      return;
    }

    const urls = lines.map((line) =>
      line.startsWith("http")
        ? line
        : `https://ra.co/dj/${line.toLowerCase().replace(/\s+/g, "")}`,
    );

    setLoading(true);
    setFetchError(null);
    setArtists([]);
    setInsertResults(null);
    setRelatedPool([]);
    setSelectedRelated(new Set());
    setRelatedFetchData(null);
    setRelatedInsertResults(null);

    try {
      const res = await fetch("/api/apify/ra-artists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch artists");

      const fetchedArtists = json.data || [];
      setArtists(fetchedArtists);

      // -- Console: Artists Ready For Insertion ------------------------------
      const preview = fetchedArtists.map(buildInsertionPreview);
      console.group("?? Artists Ready For Insertion");
      preview.forEach((p) => {
        console.log(`?? ${p.stage_name} ??`);
        console.log(p);
      });
      console.groupEnd();

      // Build initial related pool
      const pool = collectRelatedPool(fetchedArtists);
      setRelatedPool(pool);
      console.log(
        `?? Related artists pool (${pool.length}):`,
        pool.map((r) => `${r.artistName} (${r.followerCount ?? 0} followers)`),
      );
    } catch (err) {
      console.error("? Fetch error:", err);
      setFetchError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // -- Insert main artists ---------------------------------------------------
  const handleInsertArtists = async () => {
    if (artists.length === 0) return;
    setIsInserting(true);
    setInsertResults(null);

    try {
      const res = await fetch("/api/automation/artist-album/insert-ra-artist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(artists),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Insert failed");

      setInsertResults(json);
      console.log("? Main insert result:", json);
      dispatch(setError({ message: json.message, type: "success" }));
    } catch (err) {
      console.error("? Insert error:", err);
      dispatch(setError({ message: err.message, type: "error" }));
    } finally {
      setIsInserting(false);
    }
  };

  // -- Fetch & check selected related artists --------------------------------
  const handleFetchSelectedRelated = async () => {
    if (selectedRelated.size === 0) return;

    const selectedItems = relatedPool.filter((r) =>
      selectedRelated.has(r.artistName),
    );
    const relatedUrls = selectedItems
      .filter((r) => r.url)
      .map((r) => (r.url.startsWith("http") ? r.url : `https://ra.co${r.url}`));

    if (relatedUrls.length === 0) return;

    setRelatedFetching(true);
    setRelatedFetchData(null);
    setRelatedInsertResults(null);

    try {
      console.log(
        `?? Fetching ${relatedUrls.length} selected related artists...`,
        relatedUrls,
      );

      const raRes = await fetch("/api/apify/ra-artists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: relatedUrls }),
      });
      const raJson = await raRes.json();
      if (!raRes.ok) throw new Error(raJson.error || "Failed to fetch from RA");

      const fetched = raJson.data || [];
      const names = fetched.map((a) => a.artistName).filter(Boolean);

      // DB duplicate check
      const checkRes = await fetch(
        "/api/automation/artist-album/check-existing-artists",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ names }),
        },
      );
      const checkJson = await checkRes.json();
      if (!checkRes.ok)
        throw new Error(checkJson.error || "Failed to check existing artists");

      const alreadyExistSet = new Set(checkJson.alreadyExist || []);
      const toInsert = fetched.filter(
        (a) => !alreadyExistSet.has(a.artistName),
      );

      // -- Console log -------------------------------------------------------
      console.group(
        `?? Related Artists Ready For Insertion (${toInsert.length} of ${fetched.length})`,
      );
      toInsert.map(buildInsertionPreview).forEach((p) => {
        console.log(`?? ${p.stage_name} ??`);
        console.log(p);
      });
      if (alreadyExistSet.size > 0) {
        console.log("?? Already in DB (skipping):", [...alreadyExistSet]);
      }
      console.groupEnd();

      setRelatedFetchData({
        fetched,
        toInsert,
        alreadyExist: checkJson.alreadyExist || [],
      });
    } catch (err) {
      console.error("? Related fetch error:", err);
      dispatch(setError({ message: err.message, type: "error" }));
    } finally {
      setRelatedFetching(false);
    }
  };

  // -- Insert selected related artists --------------------------------------
  const handleInsertRelatedArtists = async () => {
    if (!relatedFetchData || relatedFetchData.toInsert.length === 0) return;
    setIsInsertingRelated(true);
    setRelatedInsertResults(null);

    try {
      const res = await fetch("/api/automation/artist-album/insert-ra-artist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(relatedFetchData.toInsert),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Insert failed");

      setRelatedInsertResults(json);
      console.log("? Related insert result:", json);
      dispatch(setError({ message: json.message, type: "success" }));

      // Build the next loop's related pool from the just-fetched batch
      const nextPool = collectRelatedPool(relatedFetchData.fetched);
      if (nextPool.length > 0) {
        console.log(
          `?? Next related pool (${nextPool.length}):`,
          nextPool.map(
            (r) => `${r.artistName} (${r.followerCount ?? 0} followers)`,
          ),
        );
        setRelatedPool(nextPool);
        setSelectedRelated(new Set());
        setRelatedFetchData(null);
        setRelatedInsertResults(null);
      }
    } catch (err) {
      console.error("? Related insert error:", err);
      dispatch(setError({ message: err.message, type: "error" }));
    } finally {
      setIsInsertingRelated(false);
    }
  };

  // -- Guard -----------------------------------------------------------------
  if (!user?.is_admin) {
    return (
      <div className="min-h-screen bg-black p-8 flex items-center justify-center">
        <p className="text-cream text-xl">Access denied. Admin only.</p>
      </div>
    );
  }

  // -- Render ----------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* -- Search ----------------------------------------------------------- */}
      <div className="bg-neutral-900 border border-gold/30 p-6">
        <Title text="RA Artist Scraper" />
        <Paragraph
          text="RA artists scrapper with related artists scrapping and inserting. Only artists data from Resident Advisory"
          color="chino"
          className="mb-4"
        />
        <div className="flex flex-col gap-3">
          <textarea
            value={searchTerms}
            onChange={(e) => setSearchTerms(e.target.value)}
            placeholder={
              "https://ra.co/dj/arminvanbuuren\nhttps://ra.co/dj/taleofus"
            }
            rows={4}
            className="w-full px-4 py-2 bg-black border border-gold/30 text-cream focus:outline-none focus:border-gold resize-y font-mono text-sm"
            disabled={loading}
          />
          <div className="flex justify-end">
            <Button
              text={loading ? "Fetching..." : "Fetch Artists"}
              onClick={handleFetchArtists}
              disabled={loading}
            />
          </div>
        </div>
        {fetchError && (
          <div className="mt-4 bg-red-900/20 border border-red-500 p-4 text-red-300">
            {fetchError}
          </div>
        )}
      </div>

      {/* -- Loading ----------------------------------------------------------- */}
      {loading && (
        <div className="bg-neutral-900 border border-gold/30 p-12 flex flex-col items-center justify-center">
          <Spinner type="logo" />
          <Paragraph
            text="Fetching artist data from RA..."
            color="chino"
            className="mt-4"
          />
          <p className="text-cream-600 text-sm mt-2">
            This may take up to 2-3 minutes
          </p>
        </div>
      )}

      {/* -- Artist Cards ------------------------------------------------------ */}
      {artists.length > 0 && (
        <div className="space-y-4">
          <Title text={`${artists.length} Artist(s) Fetched`} />

          <div className="grid grid-cols-5 gap-3">
            {artists.map((ra, idx) => {
              const socialLinks = getSocialLinks(ra);
              const fullName = getFullName(ra);
              return (
                <div
                  key={idx}
                  className="flex flex-col gap-2 border border-gold/30 bg-black/40 p-3 rounded text-xs"
                >
                  <div>
                    <label className="text-[10px] text-chino/60 uppercase">
                      Stage Name
                    </label>
                    <p className="text-cream font-semibold">{ra.artistName}</p>
                  </div>
                  {fullName && fullName !== ra.artistName && (
                    <div>
                      <label className="text-[10px] text-chino/60 uppercase">
                        Real Name
                      </label>
                      <p className="text-cream">{fullName}</p>
                    </div>
                  )}
                  {ra.urlSafeName && (
                    <div>
                      <label className="text-[10px] text-chino/60 uppercase">
                        Slug
                      </label>
                      <p className="text-cream font-mono">{ra.urlSafeName}</p>
                    </div>
                  )}
                  {ra.followerCount != null && (
                    <div>
                      <label className="text-[10px] text-chino/60 uppercase">
                        Followers
                      </label>
                      <p className="text-cream">
                        {ra.followerCount.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {ra.blurb && (
                    <div>
                      <label className="text-[10px] text-chino/60 uppercase">
                        Description
                      </label>
                      <p className="text-cream/80 leading-relaxed">
                        {ra.blurb.length > 120
                          ? ra.blurb.substring(0, 120) + "..."
                          : ra.blurb}
                      </p>
                    </div>
                  )}
                  {ra.bio && (
                    <div>
                      <label className="text-[10px] text-chino/60 uppercase">
                        Bio
                      </label>
                      <p className="text-cream/80 leading-relaxed">
                        {ra.bio.length > 120
                          ? ra.bio.substring(0, 120) + "..."
                          : ra.bio}
                      </p>
                    </div>
                  )}
                  {socialLinks.length > 0 && (
                    <div>
                      <label className="text-[10px] text-chino/60 uppercase">
                        Social Links
                      </label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {socialLinks.map((link, i) => {
                          let label = link;
                          try {
                            const host = new URL(link).hostname.replace(
                              "www.",
                              "",
                            );
                            label = host.split(".")[0];
                            label =
                              label.charAt(0).toUpperCase() + label.slice(1);
                          } catch {}
                          return (
                            <a
                              key={i}
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-0.5 bg-gold/20 text-gold hover:bg-gold/30 rounded text-[10px]"
                            >
                              {label}
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* -- Insert Main Artists ------------------------------------------- */}
          <div className="bg-neutral-900 border border-gold/30 p-5 space-y-3">
            <Button
              text={
                isInserting
                  ? "Inserting..."
                  : `INSERT ${artists.length} ARTIST(S) TO DATABASE`
              }
              onClick={handleInsertArtists}
              disabled={isInserting}
            />
            {insertResults && (
              <div className="text-sm space-y-1">
                <p className="text-green-400">{insertResults.message}</p>
                {insertResults.results?.inserted?.length > 0 && (
                  <p className="text-cream/60">
                    Inserted:{" "}
                    {insertResults.results.inserted
                      .map((a) => a.artistName)
                      .join(", ")}
                  </p>
                )}
                {insertResults.results?.skipped?.length > 0 && (
                  <p className="text-yellow-400/80">
                    Skipped (already exist):{" "}
                    {insertResults.results.skipped
                      .map((a) => a.artistName)
                      .join(", ")}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* -- Related Artists Pool ------------------------------------------ */}
          {relatedPool.length > 0 && (
            <div className="bg-neutral-900 border border-gold/30 p-5 space-y-4">
              <div>
                <Title text="Related Artists" size="sm" />
                <p className="text-chino/60 text-xs mt-1">
                  Select the artists you want to scrape and insert. Only
                  selected will be fetched from RA.
                </p>
              </div>

              {/* Select all / None controls */}
              <div className="flex gap-3">
                <button
                  onClick={() =>
                    setSelectedRelated(
                      new Set(relatedPool.map((r) => r.artistName)),
                    )
                  }
                  className="text-xs text-gold/70 hover:text-gold underline"
                >
                  Select all ({relatedPool.length})
                </button>
                <button
                  onClick={() => setSelectedRelated(new Set())}
                  className="text-xs text-chino/50 hover:text-chino underline"
                >
                  Clear
                </button>
              </div>

              {/* Selectable artist buttons */}
              <div className="grid grid-cols-8 gap-2">
                {relatedPool.map((rel, i) => {
                  const isSelected = selectedRelated.has(rel.artistName);
                  return (
                    <button
                      key={i}
                      onClick={() => toggleRelated(rel.artistName)}
                      className={`flex flex-col items-center px-3 py-2 rounded border text-xs transition-all ${
                        isSelected
                          ? "bg-gold text-black border-gold font-semibold"
                          : "bg-neutral-800 text-chino border-neutral-700 hover:border-gold/50"
                      }`}
                    >
                      <span>{rel.artistName}</span>
                      <span
                        className={`mt-0.5 text-[10px] ${
                          isSelected ? "text-black/60" : "text-chino/50"
                        }`}
                      >
                        {(rel.followerCount ?? 0).toLocaleString()} followers
                      </span>
                    </button>
                  );
                })}
              </div>

              {selectedRelated.size > 0 && (
                <Button
                  text={
                    relatedFetching
                      ? "Fetching & Checking..."
                      : `Fetch & Check ${selectedRelated.size} Selected Artist(s)`
                  }
                  onClick={handleFetchSelectedRelated}
                  disabled={relatedFetching || isInsertingRelated}
                  className="w-full"
                />
              )}

              {relatedFetching && (
                <div className="flex items-center gap-3">
                  <Spinner type="logo" />
                  <p className="text-chino/70 text-sm">
                    Fetching RA data and checking database for duplicates...
                  </p>
                </div>
              )}

              {/* Related fetch result summary + insert */}
              {relatedFetchData && !relatedFetching && (
                <div className="border-t border-gold/20 pt-4 space-y-3">
                  <div className="bg-black/40 border border-gold/20 p-4 rounded text-sm space-y-1">
                    <p className="text-cream font-semibold">
                      Related Artists Check Result
                    </p>
                    <p className="text-cream/70">
                      Fetched from RA:{" "}
                      <span className="text-cream">
                        {relatedFetchData.fetched.length}
                      </span>
                    </p>
                    <p className="text-yellow-400/80">
                      Already in database:{" "}
                      <span className="text-yellow-400">
                        {relatedFetchData.alreadyExist.length}
                      </span>
                      {relatedFetchData.alreadyExist.length > 0 && (
                        <> - {relatedFetchData.alreadyExist.join(", ")}</>
                      )}
                    </p>
                    <p className="text-green-400">
                      Ready to insert:{" "}
                      <span className="font-bold">
                        {relatedFetchData.toInsert.length}
                      </span>
                      {relatedFetchData.toInsert.length > 0 && (
                        <>
                          {" "}
                          -{" "}
                          {relatedFetchData.toInsert
                            .map((a) => a.artistName)
                            .join(", ")}
                        </>
                      )}
                    </p>
                  </div>

                  {/* Related fetched artists grid */}
                  {relatedFetchData.toInsert.length > 0 && (
                    <div className="grid grid-cols-5 gap-3">
                      {relatedFetchData.toInsert.map((ra, idx) => {
                        const fullName = getFullName(ra);
                        const socialLinks = getSocialLinks(ra);
                        return (
                          <div
                            key={idx}
                            className="flex flex-col gap-2 border border-gold/30 bg-black/40 p-3 rounded text-xs"
                          >
                            <div>
                              <label className="text-[10px] text-chino/60 uppercase">
                                Stage Name
                              </label>
                              <p className="text-cream font-semibold">
                                {ra.artistName}
                              </p>
                            </div>
                            {fullName && fullName !== ra.artistName && (
                              <div>
                                <label className="text-[10px] text-chino/60 uppercase">
                                  Real Name
                                </label>
                                <p className="text-cream">{fullName}</p>
                              </div>
                            )}
                            {ra.urlSafeName && (
                              <div>
                                <label className="text-[10px] text-chino/60 uppercase">
                                  Slug
                                </label>
                                <p className="text-cream font-mono">
                                  {ra.urlSafeName}
                                </p>
                              </div>
                            )}
                            {ra.followerCount != null && (
                              <div>
                                <label className="text-[10px] text-chino/60 uppercase">
                                  Followers
                                </label>
                                <p className="text-cream">
                                  {ra.followerCount.toLocaleString()}
                                </p>
                              </div>
                            )}
                            {ra.blurb && (
                              <div>
                                <label className="text-[10px] text-chino/60 uppercase">
                                  Description
                                </label>
                                <p className="text-cream/80 leading-relaxed">
                                  {ra.blurb.length > 120
                                    ? ra.blurb.substring(0, 120) + "..."
                                    : ra.blurb}
                                </p>
                              </div>
                            )}
                            {ra.bio && (
                              <div>
                                <label className="text-[10px] text-chino/60 uppercase">
                                  Bio
                                </label>
                                <p className="text-cream/80 leading-relaxed">
                                  {ra.bio.length > 120
                                    ? ra.bio.substring(0, 120) + "..."
                                    : ra.bio}
                                </p>
                              </div>
                            )}
                            {socialLinks.length > 0 && (
                              <div>
                                <label className="text-[10px] text-chino/60 uppercase">
                                  Social Links
                                </label>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {socialLinks.map((link, i) => {
                                    let label = link;
                                    try {
                                      const host = new URL(
                                        link,
                                      ).hostname.replace("www.", "");
                                      label = host.split(".")[0];
                                      label =
                                        label.charAt(0).toUpperCase() +
                                        label.slice(1);
                                    } catch {}
                                    return (
                                      <a
                                        key={i}
                                        href={link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-2 py-0.5 bg-gold/20 text-gold hover:bg-gold/30 rounded text-[10px]"
                                      >
                                        {label}
                                      </a>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {relatedFetchData.toInsert.length > 0 &&
                    !relatedInsertResults && (
                      <Button
                        text={
                          isInsertingRelated
                            ? "Inserting..."
                            : `INSERT ${relatedFetchData.toInsert.length} RELATED ARTIST(S)?`
                        }
                        onClick={handleInsertRelatedArtists}
                        disabled={isInsertingRelated}
                        className="w-full bg-green-500/20 hover:bg-green-500/30"
                      />
                    )}

                  {relatedInsertResults && (
                    <div className="text-sm space-y-1">
                      <p className="text-green-400">
                        {relatedInsertResults.message}
                      </p>
                      {relatedInsertResults.results?.inserted?.length > 0 && (
                        <p className="text-cream/60">
                          Inserted:{" "}
                          {relatedInsertResults.results.inserted
                            .map((a) => a.artistName)
                            .join(", ")}
                        </p>
                      )}
                      {relatedInsertResults.results?.skipped?.length > 0 && (
                        <p className="text-yellow-400/80">
                          Skipped:{" "}
                          {relatedInsertResults.results.skipped
                            .map((a) => a.artistName)
                            .join(", ")}
                        </p>
                      )}
                      <p className="text-chino/60 text-xs mt-2">
                        ? A new related artists pool has been loaded from the
                        just-inserted batch. Select and repeat.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RaArtists;
