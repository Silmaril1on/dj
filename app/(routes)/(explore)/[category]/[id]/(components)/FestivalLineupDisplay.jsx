"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Spinner from "@/app/components/ui/Spinner";
import Motion from "@/app/components/containers/Motion";
import Dot from "@/app/components/ui/Dot";
import LayoutButtons from "@/app/components/buttons/LayoutButtons";

const normalizeArtist = (artist) => {
  if (!artist) return null;

  if (typeof artist === "string") {
    return { name: artist, slug: null, day: null };
  }

  const name = artist.name || "";
  if (!name) return null;

  return {
    name,
    slug: artist.artist_slug || null,
    day: artist.artist_day || artist.day || null,
  };
};

const sortArtistsByName = (artists) =>
  [...artists].sort((a, b) => a.name.localeCompare(b.name));

const ArtistRowItem = ({ artist, index, total }) => {
  const hasSlug = Boolean(artist.slug);

  return (
    <div className="flex leading-none items-center text-cream gap-1 lg:gap-2 uppercase font-bold text-lg lg:text-2xl">
      {hasSlug ? (
        <Link href={`/artists/${artist.slug}`}>
          <h1 className=" hover:text-gold duration-300">{artist.name}</h1>
        </Link>
      ) : (
        <h1 className="brightness-70">{artist.name}</h1>
      )}
      {index < total - 1 && <Dot />}
    </div>
  );
};

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
          key={`${group.key}-${artist.name}-${artistIndex}`}
          artist={artist}
          index={artistIndex}
          total={group.artists.length}
        />
      ))}
    </div>
  </Motion>
);

const FestivalLineupDisplay = ({ festivalId }) => {
  const [lineup, setLineup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("all");

  const layoutOptions = [
    { value: "all", label: "Lineup" },
    { value: "by-stage", label: "By Stage" },
    { value: "by-day", label: "By Day" },
  ];

  const groups = useMemo(() => {
    const safeLineup = Array.isArray(lineup) ? lineup : [];

    if (safeLineup.length === 0) {
      return [];
    }

    if (viewMode === "all") {
      const artists = sortArtistsByName(
        safeLineup
          .flatMap((stage) => stage.artists)
          .map(normalizeArtist)
          .filter(Boolean),
      );

      return [
        {
          key: "all",
          title: "",
          artists,
        },
      ];
    }

    if (viewMode === "by-stage") {
      return safeLineup.map((stage, stageIndex) => ({
        key: `stage-${stage.stage_name || stageIndex}`,
        title: (stage.stage_name || "TBA").toUpperCase(),
        artists: sortArtistsByName(
          (stage.artists || []).map(normalizeArtist).filter(Boolean),
        ),
      }));
    }

    const artistsByDay = safeLineup
      .flatMap((stage) => stage.artists)
      .map(normalizeArtist)
      .filter(Boolean)
      .reduce((acc, artist) => {
        const day = artist.day || "TBA";
        if (!acc[day]) {
          acc[day] = [];
        }
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
      artists: sortArtistsByName(artistsByDay[day]),
    }));
  }, [lineup, viewMode]);

  useEffect(() => {
    const fetchLineup = async () => {
      try {
        const response = await fetch(
          `/api/festivals/lineup?festival_id=${festivalId}`,
        );
        if (!response.ok) {
          console.error("Failed to fetch lineup", response.status);
          setLineup([]);
          return;
        }

        const data = await response.json();
        setLineup(Array.isArray(data?.lineup) ? data.lineup : []);
      } catch (error) {
        console.error("Error fetching lineup:", error);
        setLineup([]);
      } finally {
        setLoading(false);
      }
    };

    if (festivalId) {
      fetchLineup();
    }
  }, [festivalId]);

  if (loading) {
    return (
      <div className="py-8 center">
        <Spinner />
      </div>
    );
  }

  if (groups.length === 0) {
    return null;
  }

  return (
    <div className="center flex-col relative py-20">
      <div className="space-y-6">
        <div className="flex justify-center">
          <LayoutButtons
            options={layoutOptions}
            activeOption={viewMode}
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
