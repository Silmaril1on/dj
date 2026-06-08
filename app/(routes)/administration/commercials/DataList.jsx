"use client";

import React, { useMemo, useState } from "react";
import { MdKeyboardArrowDown } from "react-icons/md";

const getWeekOfMonth = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 1;
  return Math.min(Math.ceil(date.getDate() / 7), 4);
};

const formatDate = (startDate, endDate) => {
  if (!startDate) return "TBA";
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;
  const month = start.toLocaleString("en-US", { month: "short" });
  const startDay = start.getDate();
  const endDay = end && !Number.isNaN(end.getTime()) ? end.getDate() : null;

  return `${month} ${startDay}${endDay && endDay !== startDay ? `-${endDay}` : ""}`;
};

const DataList = ({
  festivals = [],
  selectedFestivalId = null,
  isLoading = false,
  error = "",
  onSelect,
}) => {
  const [collapsedWeeks, setCollapsedWeeks] = useState({});

  const weeks = useMemo(() => {
    return festivals.reduce((acc, festival) => {
      const week = getWeekOfMonth(festival.start_date);
      if (!acc[week]) acc[week] = [];
      acc[week].push(festival);
      return acc;
    }, {});
  }, [festivals]);

  const toggleWeek = (week) => {
    setCollapsedWeeks((prev) => ({
      ...prev,
      [week]: !(prev[week] ?? false),
    }));
  };

  return (
    <aside className="min-h-[720px] border border-gold/30 bg-black/40 p-4 text-cream">
      <div className="mb-4 border-b border-gold/20 pb-3">
        <p className="secondary text-[10px] uppercase tracking-[0.35em] text-chino">
          This Month
        </p>
        <h2 className="text-xl font-bold uppercase text-gold">Festivals</h2>
      </div>

      {isLoading && (
        <p className="secondary text-xs uppercase tracking-widest text-chino">
          Loading festivals...
        </p>
      )}

      {error && (
        <p className="border border-crimson/40 bg-crimson/10 p-3 text-xs uppercase text-crimson">
          {error}
        </p>
      )}

      {!isLoading && !error && festivals.length === 0 && (
        <p className="secondary text-xs uppercase tracking-widest text-chino">
          No festivals found for this month.
        </p>
      )}

      <div className="space-y-5">
        {[1, 2, 3, 4].map((week) => {
          const weekFestivals = weeks[week] || [];
          if (!weekFestivals.length) return null;
          const isCollapsed = Boolean(collapsedWeeks[week]);

          return (
            <section key={week}>
              <div className="mb-2 flex items-center justify-between border-b border-gold/15 pb-1">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold">
                  Week {week}
                </p>
                <button
                  type="button"
                  onClick={() => toggleWeek(week)}
                  className="flex h-6 w-6 items-center justify-center text-gold transition hover:text-cream"
                  aria-expanded={!isCollapsed}
                  aria-label={`${isCollapsed ? "Expand" : "Collapse"} week ${week}`}
                  title={`${isCollapsed ? "Expand" : "Collapse"} week ${week}`}
                >
                  <MdKeyboardArrowDown
                    className={`text-xl transition-transform duration-300 ${
                      isCollapsed ? "rotate-180" : "rotate-0"
                    }`}
                  />
                </button>
              </div>
              {!isCollapsed && (
                <div className="space-y-1">
                  {weekFestivals.map((festival) => {
                    const isSelected = festival.id === selectedFestivalId;
                    const isPast =
                      typeof festival.status === "string" &&
                      festival.status.toLowerCase() === "past";

                    return (
                      <button
                        key={`${festival.id}-${festival.edition_id}`}
                        type="button"
                        onClick={() => onSelect?.(festival)}
                        className={`w-full border p-1 text-left transition ${
                          isSelected
                            ? "border-gold bg-gold/15"
                            : "border-gold/20 bg-stone-900 hover:border-gold/60"
                        } relative`}
                      >
                        {isPast && (
                          <span className="absolute right-1 top-1 text-[9px] font-bold uppercase tracking-wide text-crimson">
                            status: past
                          </span>
                        )}
                        <span className="block truncate pr-20 text-sm font-black uppercase leading-none text-cream">
                          {festival.name}
                        </span>
                        <span className=" block text-[10px] secondary capitalize tracking-widest text-chino">
                          {festival.country} / {festival.city}
                        </span>
                        <span className=" block text-xs font-bold uppercase text-gold">
                          {formatDate(festival.start_date, festival.end_date)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </aside>
  );
};

export default DataList;
