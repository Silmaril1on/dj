"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { useSelector } from "react-redux";
import Spinner from "@/app/components/ui/Spinner";
import Motion from "@/app/components/containers/Motion";
import Dot from "@/app/components/ui/Dot";
import LayoutButtons from "@/app/components/buttons/LayoutButtons";
import { resolveImage } from "@/app/helpers/utils";
import { selectIsAuthenticated } from "@/app/features/userSlice";
import { IoMusicalNotesOutline } from "react-icons/io5";

const LIVE_RE = /\s+live$/i;
const B2B_RE = /\s*b2b\s*/i;

const cleanRawName = (value) => {
  if (!value) return "";
  return value.toString().trim().replace(/\s+/g, " ");
};

const normalizeKey = (value) => {
  const cleaned = cleanRawName(value);
  if (!cleaned) return "";
  return cleaned
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
};

const buildArtistObject = (rawName, artistMap, overrideSlug, overrideImage) => {
  const cleanedRaw = cleanRawName(rawName);
  if (!cleanedRaw) return null;

  const hasLive = LIVE_RE.test(cleanedRaw);
  const baseText = cleanedRaw.replace(LIVE_RE, "").trim();
  const chunks = baseText
    .split(B2B_RE)
    .map((chunk) => cleanRawName(chunk))
    .filter(Boolean);

  const hasB2B = chunks.length > 1;

  const parts = chunks.map((chunk, index) => {
    const mapKey = normalizeKey(chunk);
    const dbArtist = artistMap?.get(mapKey) || null;

    return {
      name: chunk,
      slug:
        dbArtist?.artist_slug ||
        dbArtist?.slug ||
        (!hasB2B && index === 0 ? overrideSlug : null) ||
        null,
      image_url:
        dbArtist?.image_url ||
        (!hasB2B && index === 0 ? overrideImage : null) ||
        null,
    };
  });

  return { rawName: cleanedRaw, parts, hasB2B, hasLive };
};

const normalizeEventArtist = (entry, artistMap) => {
  if (!entry) return null;

  const rawName = cleanRawName(
    typeof entry === "string" ? entry : entry.name || entry.artist_name || "",
  );
  if (!rawName) return null;

  if (entry?.b2bParts?.length) {
    const hasLive = LIVE_RE.test(rawName);
    const parts = entry.b2bParts
      .map((part, index) => {
        const partObj = typeof part === "string" ? { name: part } : part || {};
        let name = cleanRawName(partObj.name || "");
        if (!name) return null;
        if (hasLive && index === entry.b2bParts.length - 1) {
          name = cleanRawName(name.replace(LIVE_RE, ""));
        }

        const mapKey = normalizeKey(name);
        const dbArtist = artistMap?.get(mapKey) || null;

        return {
          name,
          slug:
            partObj.artist_slug ||
            partObj.slug ||
            dbArtist?.artist_slug ||
            dbArtist?.slug ||
            null,
          image_url: partObj.image_url || dbArtist?.image_url || null,
        };
      })
      .filter(Boolean);

    return {
      rawName,
      parts,
      hasB2B: parts.length > 1,
      hasLive,
    };
  }

  return buildArtistObject(
    rawName,
    artistMap,
    entry.artist_slug,
    entry.image_url,
  );
};

const sortByRawName = (artists) =>
  [...artists].sort((a, b) => a.rawName.localeCompare(b.rawName));

const HoverImage = ({ src, name, springX, springY }) =>
  createPortal(
    <motion.div
      className="fixed top-0 left-0 w-28 h-28 overflow-hidden pointer-events-none z-[9999] border border-gold/40 shadow-lg shadow-black/60"
      style={{ x: springX, y: springY }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.15 }}
    >
      <img
        loading="lazy"
        src={src}
        alt={name}
        className="w-full h-full object-cover"
      />
    </motion.div>,
    document.body,
  );

const ArtistPart = ({ name, slug, image_url }) => {
  const imgSrc = slug ? resolveImage(image_url, "md") : null;
  const [isHovered, setIsHovered] = useState(false);

  const mouseX = useMotionValue(-9999);
  const mouseY = useMotionValue(-9999);
  const springX = useSpring(mouseX, { stiffness: 500, damping: 32, mass: 0.4 });
  const springY = useSpring(mouseY, { stiffness: 500, damping: 32, mass: 0.4 });

  const handleMouseEnter = (e) => {
    springX.jump(e.clientX - 56);
    springY.jump(e.clientY - 138);
    setIsHovered(true);
  };

  const handleMouseMove = (e) => {
    mouseX.set(e.clientX - 56);
    mouseY.set(e.clientY - 138);
  };

  const nameEl = (
    <span
      className={`text-xl md:text-2xl font-bold uppercase leading-none ${
        slug ? "text-cream hover:text-gold duration-300" : "text-cream/60"
      }`}
    >
      {name}
    </span>
  );

  return (
    <span className="inline-flex items-start gap-0.5">
      {slug ? (
        <Link
          href={`/artists/${slug}`}
          className="inline-flex items-start gap-0.5"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={() => setIsHovered(false)}
          onMouseMove={handleMouseMove}
        >
          {nameEl}
        </Link>
      ) : (
        nameEl
      )}
      {isHovered && imgSrc && (
        <HoverImage
          src={imgSrc}
          name={name}
          springX={springX}
          springY={springY}
        />
      )}
    </span>
  );
};

const B2B_BADGE = (
  <span className="text-[7px] md:text-[9px] text-cream/60 uppercase font-bold self-start leading-none mt-1">
    B2B
  </span>
);

const LIVE_BADGE = (
  <span className="text-[7px] md:text-[9px] text-cream/60 uppercase font-bold self-start leading-none mt-0.5">
    LIVE
  </span>
);

const ArtistRowItem = ({ artist, index, total }) => (
  <div className="flex leading-none items-center gap-1 lg:gap-2">
    <span className="inline-flex items-start gap-1 flex-wrap">
      {artist.parts.map((part, i) => (
        <span key={i} className="inline-flex items-start gap-1">
          <ArtistPart {...part} />
          {artist.hasB2B && i < artist.parts.length - 1 && B2B_BADGE}
        </span>
      ))}
      {artist.hasLive && LIVE_BADGE}
    </span>
    {index < total - 1 && <Dot />}
  </div>
);

const ArtistGroup = ({ group, index }) => (
  <Motion
    animation="fade"
    delay={0.2 + index * 0.2}
    className="center flex-col w-full lg:w-4xl px-4"
  >
    {group.title && (
      <h2 className="text-gold text-2xl lg:text-3xl font-bold uppercase text-center mb-3">
        {group.title}
      </h2>
    )}
    <div className="flex flex-wrap items-center gap-2 justify-center">
      {group.artists.map((artist, artistIndex) => (
        <ArtistRowItem
          key={`${group.key}-${artist.rawName}-${artistIndex}`}
          artist={artist}
          index={artistIndex}
          total={group.artists.length}
        />
      ))}
    </div>
  </Motion>
);

// ─── Lineup Alert subscribe button ───────────────────────────────────────────
const LineupAlertButton = ({ festivalId }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [status, setStatus] = useState("idle"); // idle | loading | subscribed | error
  const [subscriptionChecked, setSubscriptionChecked] = useState(false);

  // Check existing subscription on mount
  useEffect(() => {
    if (!isAuthenticated || !festivalId) {
      setSubscriptionChecked(true);
      return;
    }
    fetch(
      `/api/notifications/subscriptions?entity_type=festival&entity_id=${festivalId}&notification_type=lineup_phase_drop`,
    )
      .then((r) => r.json())
      .then((json) => {
        if (json.subscribed) setStatus("subscribed");
      })
      .catch(() => {})
      .finally(() => setSubscriptionChecked(true));
  }, [isAuthenticated, festivalId]);

  const handleSubscribe = useCallback(async () => {
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/notifications/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity_type: "festival",
          entity_id: festivalId,
          notification_type: "lineup_phase_drop",
        }),
      });
      if (res.ok) {
        setStatus("subscribed");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }, [isAuthenticated, festivalId]);

  const handleUnsubscribe = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/notifications/subscriptions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity_type: "festival",
          entity_id: festivalId,
          notification_type: "lineup_phase_drop",
        }),
      });
      if (res.ok) setStatus("idle");
      else setStatus("subscribed");
    } catch {
      setStatus("subscribed");
    }
  }, [festivalId]);

  if (!subscriptionChecked) return null;

  return (
    <AnimatePresence mode="wait">
      {status === "subscribed" ? (
        <motion.button
          key="subscribed"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={handleUnsubscribe}
          className="flex items-center gap-2 px-5 py-2 border border-green-500/50 text-green-500 text-xs uppercase tracking-widest hover:bg-green-500/20 transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
          Alert active - cancel
        </motion.button>
      ) : (
        <motion.button
          key="subscribe"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          disabled={status === "loading"}
          onClick={handleSubscribe}
          className="flex items-center cursor-pointer gap-2 px-6 py-2.5 bg-gold text-black text-xs font-bold uppercase tracking-widest hover:bg-gold/85 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "loading" ? (
            <span className="w-3 h-3 border border-black/40 border-t-black rounded-full animate-spin inline-block" />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-3.5 h-3.5"
            >
              <path d="M5.85 3.5a.75.75 0 00-1.117-1 9.719 9.719 0 00-2.348 4.876.75.75 0 001.479.248A8.219 8.219 0 015.85 3.5zM19.267 2.5a.75.75 0 10-1.118 1 8.22 8.22 0 011.987 4.124.75.75 0 001.48-.248A9.72 9.72 0 0019.266 2.5z" />
              <path
                fillRule="evenodd"
                d="M12 2.25A6.75 6.75 0 005.25 9v.75a8.217 8.217 0 01-2.119 5.52.75.75 0 00.298 1.206c1.544.57 3.16.99 4.831 1.243a3.75 3.75 0 107.48 0 24.583 24.583 0 004.83-1.244.75.75 0 00.298-1.205 8.217 8.217 0 01-2.118-5.52V9A6.75 6.75 0 0012 2.25zM9.75 18c0-.034 0-.067.002-.1a25.05 25.05 0 004.496 0l.002.1a2.25 2.25 0 01-4.5 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {status === "error" ? "Try again" : "Notify me when lineup drops"}
        </motion.button>
      )}
    </AnimatePresence>
  );
};

// ─── No-lineup placeholder ────────────────────────────────────────────────────
const NoLineupContainer = ({ festivalId }) => (
  <Motion animation="fade" delay={0.1} className="center flex-col py-20 px-4">
    <div className="max-w-md w-full border border-gold/30  bg-stone-950 p-10 flex flex-col items-center gap-6 text-center">
      {/* Icon */}
      <div className="w-18 h-18 rounded-full border border-gold/30 flex items-center justify-center">
        <IoMusicalNotesOutline size={30} />
      </div>

      <div className="space-y-2">
        <p className="text-cream text-sm font-semibold uppercase tracking-widest">
          Lineup not announced yet
        </p>
        <p className="text-chino/90 text-xs leading-relaxed max-w-[280px] secondary">
          The lineup for this festival hasn't been revealed yet. Set up an alert
          and we'll email you the moment artists are announced.
        </p>
      </div>

      <LineupAlertButton festivalId={festivalId} />
    </div>
  </Motion>
);

// ─── Timetable components ─────────────────────────────────────────────────────────
const TimetableCard = ({ artist }) => {
  const timeLine =
    artist.time_from && artist.time_to
      ? `${artist.time_from} – ${artist.time_to}`
      : artist.time_from || "";
  const firstPart = artist.parts?.[0];
  return (
    <div className="bg-stone-900/60 border border-chino/15 p-3 flex flex-col gap-1.5 min-h-[72px]">
      {timeLine && (
        <p className="text-gold text-[10px] font-semibold secondary tracking-wide">
          {timeLine}
        </p>
      )}
      {firstPart?.slug ? (
        <Link
          href={`/artists/${firstPart.slug}`}
          className="text-cream font-bold uppercase text-xs leading-tight hover:text-gold transition-colors"
        >
          {artist.rawName}
        </Link>
      ) : (
        <p className="text-cream font-bold uppercase text-xs leading-tight">
          {artist.rawName}
        </p>
      )}
    </div>
  );
};

const TimetableSection = ({ stages }) => {
  const artistsByDay = stages
    .flatMap((s) => s.artists)
    .filter((a) => a.time_from)
    .reduce((acc, a) => {
      const day = a.day || "TBA";
      if (!acc[day]) acc[day] = [];
      acc[day].push(a);
      return acc;
    }, {});

  const sortedDays = Object.keys(artistsByDay).sort((a, b) => {
    if (a === "TBA") return 1;
    if (b === "TBA") return -1;
    return a.localeCompare(b);
  });

  if (sortedDays.length === 0) return null;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 space-y-10">
      {sortedDays.map((day) => {
        const sorted = [...artistsByDay[day]].sort((a, b) =>
          (a.time_from || "").localeCompare(b.time_from || ""),
        );
        return (
          <div key={day}>
            <h2 className="text-gold text-2xl lg:text-3xl font-bold uppercase mb-4">
              {day}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {sorted.map((artist, i) => (
                <TimetableCard
                  key={`${day}-${artist.rawName}-${i}`}
                  artist={artist}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const FestivalLineupDisplay = ({ festivalId, eventArtists }) => {
  const [lineup, setLineup] = useState([]);
  const [standardArtists, setStandardArtists] = useState([]);
  const [lineupType, setLineupType] = useState("none");
  const [artistMap, setArtistMap] = useState(null);
  const [loading, setLoading] = useState(Boolean(festivalId) && !eventArtists);
  const [viewMode, setViewMode] = useState("all");

  useEffect(() => {
    const build = async () => {
      try {
        const res = await fetch(
          "/api/artists?limit=9999&fields=name,stage_name,artist_slug,image_url",
        );
        if (!res.ok) return;
        const json = await res.json();
        const list = json?.artists || json?.data || [];
        const map = new Map();
        list.forEach((a) => {
          if (a.name) map.set(normalizeKey(a.name), a);
          if (a.stage_name && a.stage_name !== a.name) {
            map.set(normalizeKey(a.stage_name), a);
          }
        });
        setArtistMap(map);
      } catch {
        // non-fatal
      }
    };
    build();
  }, []);

  useEffect(() => {
    if (eventArtists) {
      setLoading(false);
    }
  }, [eventArtists]);

  useEffect(() => {
    if (!festivalId) return;

    const fetchLineup = async () => {
      try {
        const response = await fetch(
          `/api/festivals/lineup?festival_id=${festivalId}`,
        );
        if (!response.ok) {
          setLineup([]);
          setStandardArtists([]);
          setLineupType("none");
          return;
        }

        const data = await response.json();
        setLineup(Array.isArray(data?.lineup) ? data.lineup : []);
        setStandardArtists(
          Array.isArray(data?.standardArtists) ? data.standardArtists : [],
        );
        setLineupType(data?.lineupType || "none");
      } catch {
        setLineup([]);
        setStandardArtists([]);
        setLineupType("none");
      } finally {
        setLoading(false);
      }
    };

    fetchLineup();
  }, [festivalId]);

  const normalizedEventArtists = useMemo(() => {
    if (!eventArtists || !artistMap) return null;
    const list = Array.isArray(eventArtists) ? eventArtists : [eventArtists];
    return list
      .map((entry) => normalizeEventArtist(entry, artistMap))
      .filter(Boolean);
  }, [eventArtists, artistMap]);

  const normalizedFestival = useMemo(() => {
    if (eventArtists || !artistMap) {
      return { stages: [], standard: [], all: [] };
    }

    const safeLineup = Array.isArray(lineup) ? lineup : [];
    const stages = safeLineup.map((stage, stageIndex) => {
      const artists = (stage.artists || [])
        .map((a) => {
          const artistObj = buildArtistObject(
            a.name,
            artistMap,
            a.artist_slug,
            a.image_url,
          );
          if (!artistObj) return null;
          return {
            ...artistObj,
            day: a.day || a.artist_day || null,
            time_from: a.time_from || null,
            time_to: a.time_to || null,
            support_act: a.support_act || false,
          };
        })
        .filter(Boolean);

      return {
        key: `stage-${stage.stage_name || stageIndex}`,
        title: (stage.stage_name || "TBA").toUpperCase(),
        artists,
      };
    });

    const standard = (standardArtists || [])
      .map((a) => {
        const artistObj = buildArtistObject(
          a.name,
          artistMap,
          a.artist_slug,
          a.image_url,
        );
        if (!artistObj) return null;
        return { ...artistObj, support_act: a.support_act || false };
      })
      .filter(Boolean);

    const all = [...stages.flatMap((stage) => stage.artists), ...standard];

    return { stages, standard, all };
  }, [eventArtists, lineup, standardArtists, artistMap]);

  const allNormalized = eventArtists
    ? normalizedEventArtists || []
    : normalizedFestival.all;

  const allSorted = useMemo(
    () => sortByRawName(allNormalized),
    [allNormalized],
  );

  const hasStages =
    !eventArtists && (lineupType === "enhanced" || lineupType === "mixed");
  const hasDays =
    hasStages &&
    normalizedFestival.stages.some((stage) =>
      stage.artists.some((artist) => artist.day),
    );
  const hasTimetable =
    hasStages &&
    normalizedFestival.stages.some((stage) =>
      stage.artists.some((artist) => artist.time_from),
    );

  const layoutOptions = [
    { value: "all", label: "Lineup" },
    ...(hasStages ? [{ value: "by-stage", label: "By Stage" }] : []),
    ...(hasDays ? [{ value: "by-day", label: "By Day" }] : []),
    ...(hasTimetable ? [{ value: "timetable", label: "Timetable" }] : []),
  ];

  const safeViewMode =
    viewMode === "by-stage" && !hasStages
      ? "all"
      : viewMode === "by-day" && !hasDays
        ? "all"
        : viewMode === "timetable" && !hasTimetable
          ? "all"
          : viewMode;

  const groups = useMemo(() => {
    if (allSorted.length === 0) return [];

    if (safeViewMode === "timetable") {
      // sentinel — indicates lineup exists; actual rendering is handled separately
      return [{ key: "__timetable__", title: "", artists: [] }];
    }

    if (safeViewMode === "all") {
      return [{ key: "all", title: "", artists: allSorted }];
    }

    if (safeViewMode === "by-stage") {
      return normalizedFestival.stages.map((stage) => ({
        key: stage.key,
        title: stage.title,
        artists: sortByRawName(stage.artists),
      }));
    }

    const artistsByDay = normalizedFestival.stages
      .flatMap((stage) => stage.artists)
      .reduce((acc, artist) => {
        const day = artist.day || "TBA";
        if (!acc[day]) acc[day] = [];
        acc[day].push(artist);
        return acc;
      }, {});

    const sortedDays = Object.keys(artistsByDay).sort((a, b) => {
      if (a === "TBA") return 1;
      if (b === "TBA") return -1;
      return a.localeCompare(b);
    });

    return sortedDays.map((day) => ({
      key: `day-${day}`,
      title: day.toUpperCase(),
      artists: sortByRawName(artistsByDay[day]),
    }));
  }, [allSorted, safeViewMode, normalizedFestival]);

  if (loading || !artistMap) {
    return (
      <div className="py-8 center">
        <Spinner />
      </div>
    );
  }

  if (groups.length === 0) {
    // For festival pages (no eventArtists prop), show the notify-me container
    if (!eventArtists && festivalId) {
      return <NoLineupContainer festivalId={festivalId} />;
    }
    return null;
  }

  return (
    <div className="center flex-col relative py-20">
      <div className="space-y-6">
        <div className="flex justify-center">
          <LayoutButtons
            options={layoutOptions}
            activeOption={safeViewMode}
            onOptionChange={setViewMode}
            color="bg-stone-900"
            layoutId="festivalLineupLayout"
          />
        </div>

        {safeViewMode === "timetable" ? (
          <TimetableSection stages={normalizedFestival.stages} />
        ) : (
          <div className="space-y-7 center flex-col">
            {groups.map((group, groupIndex) => {
              const mainArtists = group.artists.filter((a) => !a.support_act);
              const supportActs = group.artists.filter((a) => a.support_act);
              return (
                <div key={group.key} className="center flex-col w-full gap-5">
                  <ArtistGroup
                    group={{
                      ...group,
                      artists: mainArtists.length ? mainArtists : group.artists,
                    }}
                    index={groupIndex}
                  />
                  {supportActs.length > 0 && (
                    <>
                      <div className="w-full flex items-center gap-4 px-4 max-w-4xl">
                        <div className="flex-1 h-px bg-gold/40" />
                        <p className="text-gold text-xs uppercase tracking-widest">
                          Support Acts
                        </p>
                        <div className="flex-1 h-px bg-gold/40" />
                      </div>
                      <ArtistGroup
                        group={{
                          key: `${group.key}-support`,
                          title: "",
                          artists: supportActs,
                        }}
                        index={groupIndex + groups.length}
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FestivalLineupDisplay;
