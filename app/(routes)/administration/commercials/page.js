"use client";

import React, { useState } from "react";
import ThisWeeksFestivalReel from "./ThisWeeksFestivalReel";
import ThisMonthFestivalReel from "./ThisMonthFestivalReel";
import LineupAnnouncementReel from "./LineupAnnouncementReel";
import SectionContainer from "@/app/components/containers/SectionContainer";

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

  const activeTabData =
    REEL_TABS.find((tab) => tab.id === activeTab) || REEL_TABS[0];

  const ActiveComponent = activeTabData.component;

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setRestartKey((prev) => prev + 1);
  };

  const handleRestartAnimation = () => {
    setRestartKey((prev) => prev + 1);
  };

  return (
    <SectionContainer
      title="Commercials"
      description="Manage your festival commercials here."
    >
      <div className="relative w-full">
        {/* top controls */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          {/* reel tabs */}
          <div className="flex flex-wrap gap-3">
            {REEL_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`border px-4 py-2 uppercase tracking-wide transition ${
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
            className="border border-gold bg-black px-4 py-2 font-bold uppercase tracking-wide text-gold transition hover:bg-gold hover:text-black"
          >
            Restart Animation
          </button>
        </div>

        {/* reel preview area */}
        <section className="relative flex justify-center">
          <ActiveComponent key={`${activeTab}-${restartKey}`} />
        </section>
      </div>
    </SectionContainer>
  );
};

export default CommercialPage;
