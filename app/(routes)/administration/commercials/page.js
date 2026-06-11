"use client";
import React, { useEffect, useMemo, useState } from "react";
import ThisWeeksFestivalReel from "./ThisWeeksFestivalReel";
import ThisMonthFestivalReel from "./ThisMonthFestivalReel";
import LineupAnnouncementReel from "./LineupAnnouncementReel";
import SectionContainer from "@/app/components/containers/SectionContainer";
import DataList from "./DataList";
import CustomInput from "./CustomInput";

const REEL_TABS = [
  {
    id: "this-week",
    label: "This Week's Festivals",
    component: ThisWeeksFestivalReel,
  },
  {
    id: "this-month",
    label: "This Month's Festivals",
    component: ThisMonthFestivalReel,
  },
  {
    id: "lineup",
    label: "Lineup Announcement",
    component: LineupAnnouncementReel,
  },
];

const CommercialPage = () => {
  const [activeTab, setActiveTab] = useState("this-week");
  const [restartKey, setRestartKey] = useState(0);
  const [festivals, setFestivals] = useState([]);
  const [monthLabel, setMonthLabel] = useState("");
  const [monthBatchStart, setMonthBatchStart] = useState(0);
  const [monthWeekIndex, setMonthWeekIndex] = useState(null);
  const [selectedFestivalId, setSelectedFestivalId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const activeTabData =
    REEL_TABS.find((tab) => tab.id === activeTab) || REEL_TABS[0];

  const ActiveComponent = activeTabData.component;

  const selectedFestival = useMemo(() => {
    if (!festivals.length) return null;
    return (
      festivals.find((festival) => festival.id === selectedFestivalId) ||
      festivals[0]
    );
  }, [festivals, selectedFestivalId]);

  const monthWeekGroups = useMemo(() => {
    const groups = [[], [], [], []];

    festivals.forEach((festival) => {
      const startDate = new Date(festival.start_date);
      if (Number.isNaN(startDate.getTime())) return;

      const weekIndex = Math.min(Math.floor((startDate.getDate() - 1) / 7), 3);
      groups[weekIndex].push(festival);
    });

    return groups;
  }, [festivals]);

  const monthFestivals = useMemo(
    () =>
      monthWeekIndex === null
        ? festivals.slice(monthBatchStart, monthBatchStart + 5)
        : monthWeekGroups[monthWeekIndex] || [],
    [festivals, monthBatchStart, monthWeekGroups, monthWeekIndex],
  );

  const monthBatchLabel = useMemo(() => {
    if (!festivals.length) return "0 of 0";
    if (monthWeekIndex !== null) {
      return `Week ${monthWeekIndex + 1} - ${
        monthWeekGroups[monthWeekIndex]?.length || 0
      } of ${festivals.length}`;
    }
    const first = monthBatchStart + 1;
    const last = Math.min(monthBatchStart + 5, festivals.length);
    return `${first}-${last} of ${festivals.length}`;
  }, [festivals.length, monthBatchStart, monthWeekGroups, monthWeekIndex]);

  const fetchFestivals = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/reel-configs", {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to fetch reel data");
      }

      const nextFestivals = data.festivals || [];
      setFestivals(nextFestivals);
      setMonthLabel(data.monthLabel || "");
      setMonthBatchStart((prev) => (prev < nextFestivals.length ? prev : 0));
      setSelectedFestivalId((prev) => {
        if (prev && nextFestivals.some((festival) => festival.id === prev)) {
          return prev;
        }
        return nextFestivals[0]?.id || null;
      });
    } catch (err) {
      setError(err.message || "Failed to fetch reel data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFestivals();
  }, []);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setRestartKey((prev) => prev + 1);
  };

  const handleRestartAnimation = () => {
    setRestartKey((prev) => prev + 1);
  };

  const handleFestivalSelect = (festival) => {
    if (activeTab === "this-month") {
      const index = festivals.findIndex(
        (item) =>
          item.id === festival.id &&
          (item.edition_id || null) === (festival.edition_id || null),
      );
      if (index !== -1) {
        setMonthBatchStart(index);
        setMonthWeekIndex(null);
      }
      setRestartKey((prev) => prev + 1);
      return;
    }

    setSelectedFestivalId(festival.id);
    setRestartKey((prev) => prev + 1);
  };

  const handleAnimateNextMonthBatch = () => {
    setMonthWeekIndex(null);
    setMonthBatchStart((prev) => {
      const next = prev + 5;
      return next < festivals.length ? next : 0;
    });
    setRestartKey((prev) => prev + 1);
  };

  const handleAnimateMonthWeek = (weekIndex) => {
    setMonthWeekIndex(weekIndex);
    setRestartKey((prev) => prev + 1);
  };

  const handleConfigSaved = (config) => {
    setFestivals((prev) =>
      prev.map((festival) =>
        festival.id === config.entity_id &&
        (festival.edition_id || null) === (config.edition_id || null)
          ? { ...festival, reel_config: config }
          : festival,
      ),
    );
    setRestartKey((prev) => prev + 1);
  };

  return (
    <SectionContainer
      title="Commercials"
      className="relative"
      description="Manage your festival commercials here."
    >
      <div className="relative w-full">
        {/* top controls */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          {/* reel tabs */}
          <div className="flex flex-wrap gap-1">
            {REEL_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`border p-2 text-xs font-bold uppercase tracking-wide transition ${
                  activeTab === tab.id
                    ? "border-gold bg-gold text-black"
                    : "border-gold/40 text-gold hover:border-gold"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {/* restart animation button */}
          <button
            onClick={handleRestartAnimation}
            className="border fixed lg:static top-0 z-50 border-gold bg-black p-2 font-bold uppercase tracking-wide text-gold transition hover:bg-gold hover:text-black"
          >
            Restart Animation
          </button>
        </div>

        {/* reel preview area */}
        <section className="gap-10 w-full grid lg:grid-cols-3 ">
          <DataList
            festivals={festivals}
            selectedFestivalId={
              activeTab === "this-month"
                ? monthFestivals[0]?.id
                : selectedFestival?.id
            }
            isLoading={isLoading}
            error={error}
            onSelect={handleFestivalSelect}
          />
          <div className="flex items-start justify-center">
            <ActiveComponent
              key={`${activeTab}-${restartKey}`}
              festival={selectedFestival}
              festivals={monthFestivals}
              monthLabel={monthLabel}
            />
          </div>
          <CustomInput
            mode={activeTab === "this-month" ? "month" : "weekly"}
            selectedFestival={selectedFestival}
            onSaved={handleConfigSaved}
            monthBatchLabel={monthBatchLabel}
            monthBatchCount={monthFestivals.length}
            onAnimateNext={handleAnimateNextMonthBatch}
            monthWeeks={monthWeekGroups}
            activeMonthWeekIndex={monthWeekIndex}
            onAnimateWeek={handleAnimateMonthWeek}
          />
        </section>
      </div>
    </SectionContainer>
  );
};

export default CommercialPage;
