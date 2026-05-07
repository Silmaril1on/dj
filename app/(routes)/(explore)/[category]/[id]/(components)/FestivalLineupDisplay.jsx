"use client";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { motion, useMotionValue, useSpring } from "framer-motion";
import Spinner from "@/app/components/ui/Spinner";
import Motion from "@/app/components/containers/Motion";
import Dot from "@/app/components/ui/Dot";
import LayoutButtons from "@/app/components/buttons/LayoutButtons";
import { resolveImage } from "@/app/helpers/utils";

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
      .map((a) =>
        buildArtistObject(a.name, artistMap, a.artist_slug, a.image_url),
      )
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

  const layoutOptions = [
    { value: "all", label: "Lineup" },
    ...(hasStages ? [{ value: "by-stage", label: "By Stage" }] : []),
    ...(hasDays ? [{ value: "by-day", label: "By Day" }] : []),
  ];

  const safeViewMode =
    viewMode === "by-stage" && !hasStages
      ? "all"
      : viewMode === "by-day" && !hasDays
        ? "all"
        : viewMode;

  const groups = useMemo(() => {
    if (allSorted.length === 0) return [];

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

  if (groups.length === 0) return null;

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

        <div className="space-y-7 center flex-col">
          {groups.map((group, groupIndex) => (
            <ArtistGroup key={group.key} group={group} index={groupIndex} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default FestivalLineupDisplay;
