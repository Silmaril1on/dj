"use client";
import { useEffect, useState } from "react";
import Title from "@/app/components/ui/Title";
import Spinner from "@/app/components/ui/Spinner";
import Motion from "@/app/components/containers/Motion";
import Dot from "@/app/components/ui/Dot";
import LayoutButtons from "@/app/components/buttons/LayoutButtons";
import { FaList, FaTh } from "react-icons/fa";
import Twinkls from "../../commercials/Twinkles";

const FestivalLineupDisplay = ({ festivalId }) => {
  const [lineup, setLineup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("all"); 

  useEffect(() => {
    const fetchLineup = async () => {
      try {
        const response = await fetch(`/api/festivals/add-festival-lineup?festival_id=${festivalId}`);
        if (response.ok) {
          const data = await response.json();
          setLineup(data.lineup);
        }
      } catch (error) {
        console.error("Error fetching lineup:", error);
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

  if (!lineup || lineup.length === 0) {
    return null;
  }

  // Get all artists from all stages and sort alphabetically
  const getAllArtistsSorted = () => {
    const allArtists = lineup.flatMap(stage => stage.artists);
    return allArtists.sort((a, b) => a.localeCompare(b));
  };

  // Sort artists within each stage alphabetically
  const getLineupWithSortedArtists = () => {
    return lineup.map(stage => ({
      ...stage,
      artists: [...stage.artists].sort((a, b) => a.localeCompare(b))
    }));
  };

  const layoutOptions = [
    { value: "all", label: "Lineup"  },
    { value: "by-stage", label: "By Stage" },
  ];

  const renderAllArtists = () => {
    const sortedArtists = getAllArtistsSorted();
    
    return (
      <Motion
        animation="fade"
        delay={0.2}
        className="space-y-4 center flex-col w-full lg:w-4xl"
      >
        <div className="flex flex-wrap items-center gap-2 justify-center">
          {sortedArtists.map((artist, index) => (
            <div key={index} className="flex items-center gap-2">
              <Title color="cream" className="uppercase leading-none" text={artist} />
              {index < sortedArtists.length - 1 && <Dot />}
            </div>
          ))}
        </div>
      </Motion>
    );
  };

  const renderByStage = () => {
    const sortedLineup = getLineupWithSortedArtists();
    
    return sortedLineup.map((stage, stageIndex) => (
      <Motion
        key={stageIndex}
        animation="fade"
        delay={stageIndex * 0.2}
        className="center flex-col w-full lg:w-4xl"
      >
        <Title
          text={stage.stage_name.toUpperCase()}
          color="gold"
          size="xs"
          className="font-light"
        />
        <div className="flex flex-wrap items-center gap-2 justify-center">
          {stage.artists.map((artist, artistIndex) => (
            <div key={artistIndex} className="flex items-center gap-2">
              <Title color="cream" className="uppercase leading-none" text={artist} />
              {artistIndex < stage.artists.length - 1 && <Dot />}
            </div>
          ))}
        </div>
      </Motion>
    ));
  };

  return (
    <div className="center flex-col relative py-20">
      <Twinkls />
      {/* Layout Toggle Buttons */}
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
      {/* Content Based on View Mode */}
      <div className="space-y-7 center flex-col ">
        {viewMode === "all" ? renderAllArtists() : renderByStage()}
      </div>
      </div>
    </div>
  );
};

export default FestivalLineupDisplay;
