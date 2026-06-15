"use client";
import React, { useEffect, useMemo, useState } from "react";
import ThisWeeksFestivalReel from "./ThisWeeksFestivalReel";
import ThisMonthFestivalReel from "./ThisMonthFestivalReel";
import SectionContainer from "@/app/components/containers/SectionContainer";
import DataList from "./DataList";
import CustomInput from "./CustomInput";
import Button from "@/app/components/buttons/Button";
import GlobalModal from "@/app/components/modals/GlobalModal";

const REEL_TABS = [
  {
    id: "this-week",
    label: "Week's Festivals",
    component: ThisWeeksFestivalReel,
  },
  {
    id: "this-month",
    label: "Month's Festivals",
    component: ThisMonthFestivalReel,
  },
];

const RENDER_STAGES = [
  {
    min: 0,
    title: "Started rendering video",
    detail: "Warming up the reel engine and locking the selected footage.",
  },
  {
    min: 20,
    title: "Preparing your video content",
    detail: "Syncing festival data, visuals, titles, and audio cues.",
  },
  {
    min: 55,
    title: "Composing the final reel",
    detail: "Rendering frames and polishing the motion sequence.",
  },
  {
    min: 90,
    title: "Finishing some tweaks",
    detail: "Packaging the MP4 and getting the download ready.",
  },
  {
    min: 100,
    title: "Video ready",
    detail: "Your MP4 download is starting.",
  },
];

const getRenderStage = (progress) =>
  RENDER_STAGES.reduce(
    (activeStage, stage) => (progress >= stage.min ? stage : activeStage),
    RENDER_STAGES[0],
  );

const CommercialPage = () => {
  const [activeTab, setActiveTab] = useState("this-week");
  const [restartKey, setRestartKey] = useState(0);
  const [festivals, setFestivals] = useState([]);
  const [monthLabel, setMonthLabel] = useState("");
  const [monthBatchStart, setMonthBatchStart] = useState(0);
  const [monthWeekIndex, setMonthWeekIndex] = useState(null);
  const [selectedFestivalId, setSelectedFestivalId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
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

  useEffect(() => {
    if (!isRendering) return undefined;

    setRenderProgress(4);

    const progressTimer = window.setInterval(() => {
      setRenderProgress((prev) => {
        if (prev >= 96) return prev;
        if (prev < 20) return Math.min(prev + 4, 20);
        if (prev < 55) return Math.min(prev + 2.5, 55);
        if (prev < 90) return Math.min(prev + 1.2, 90);
        return Math.min(prev + 0.35, 96);
      });
    }, 700);

    return () => window.clearInterval(progressTimer);
  }, [isRendering]);

  const activeRenderStage = getRenderStage(renderProgress);

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

  const handleDownloadReel = async () => {
    setIsRendering(true);
    setRenderProgress(4);
    setError("");

    try {
      const isMonthReel = activeTab === "this-month";
      const fileName = isMonthReel
        ? `soundfolio-${monthLabel || "this-month"}-${monthBatchLabel}`
        : `soundfolio-${selectedFestival?.name || "this-week"}`;

      const response = await fetch("/api/admin/reel-render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reelType: isMonthReel ? "this-month" : "this-week",
          festival: selectedFestival,
          festivals: monthFestivals,
          monthLabel,
          fileName,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to render reel video");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")}.mp4`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setRenderProgress(100);
      await new Promise((resolve) => window.setTimeout(resolve, 800));
    } catch (err) {
      setError(err.message || "Failed to render reel video");
    } finally {
      setIsRendering(false);
    }
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
              <Button
                size="small"
                key={tab.id}
                text={tab.label}
                onClick={() => handleTabChange(tab.id)}
                className={`${activeTab === tab.id ? " " : "opacity-60"}`}
              />
            ))}
          </div>
          {/* restart animation button */}
          <div className="flex space-x-1">
            <Button
              size="small"
              text="Restart Animation"
              onClick={handleRestartAnimation}
            />
            <Button
              size="small"
              disabled={isRendering || isLoading}
              text={isRendering ? "Rendering MP4..." : "Download MP4"}
              onClick={handleDownloadReel}
            />
          </div>
        </div>

        <GlobalModal
          isOpen={isRendering}
          onClose={() => {}}
          title="Rendering MP4"
          maxWidth="max-w-lg"
          showClose={false}
        >
          <div className="space-y-6 py-1">
            <div className="relative mx-auto flex h-28 w-28 items-center justify-center rounded-full border border-gold/40 bg-gold/10">
              <div className="absolute inset-2 rounded-full border border-gold/20" />
              <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-gold" />
              <div className="text-center">
                <div className="text-3xl font-bold text-gold">
                  {Math.round(renderProgress)}%
                </div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-gold/70">
                  MP4
                </div>
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-xl font-bold uppercase text-gold">
                {activeRenderStage.title}
              </h3>
              <p className="mt-2 text-sm text-chino secondary">
                {activeRenderStage.detail}
              </p>
            </div>

            <div>
              <div className="h-2 overflow-hidden border border-gold/40 bg-black">
                <div
                  className="h-full bg-gold transition-all duration-500 ease-out"
                  style={{ width: `${renderProgress}%` }}
                />
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {RENDER_STAGES.slice(0, 4).map((stage) => (
                  <div
                    key={stage.min}
                    className={`h-1 transition-colors duration-300 ${
                      renderProgress >= stage.min ? "bg-gold" : "bg-gold/20"
                    }`}
                  />
                ))}
              </div>
            </div>

            <p className="text-center text-xs text-cream secondary">
              Keep this tab open while the reel is rendering
            </p>
          </div>
        </GlobalModal>

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
