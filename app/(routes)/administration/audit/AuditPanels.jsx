"use client";

import { useEffect, useState } from "react";
import Spinner from "@/app/components/ui/Spinner";

export const Card = ({ children, className = "" }) => (
  <div
    className={`border border-gold/20 bg-neutral-900 p-5 ${className}`}
  >
    {children}
  </div>
);

export const SectionTitle = ({ text }) => (
  <h2 className="secondary mb-1 border-b border-gold/20 pb-1 text-xs uppercase tracking-widest text-cream">
    {text}
  </h2>
);

export const Badge = ({ value, color = "gold" }) => {
  const colors = {
    gold: "bg-gold/20 text-gold",
    green: "bg-green-500/20 text-green-400",
    yellow: "bg-yellow-500/20 text-yellow-400",
    red: "bg-red-500/20 text-red-400",
    blue: "bg-blue-500/20 text-blue-400",
  };

  return (
    <span className={`px-2 py-0.5 text-sm font-bold ${colors[color]}`}>
      {value?.toLocaleString() ?? "-"}
    </span>
  );
};

export const StatRow = ({ label, value, accent = false }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-cream/80">{label}</span>
    <span
      className={`font-bold tabular-nums ${accent ? "text-gold" : "text-cream"}`}
    >
      {typeof value === "number" ? value.toLocaleString() : value || "-"}
    </span>
  </div>
);

export const formatBytes = (bytes = 0) => {
  if (!bytes) return "0 MB";
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return `${Math.round(bytes / 1024)} KB`;
  if (mb < 10) return `${mb.toFixed(1)} MB`;
  return `${Math.round(mb).toLocaleString()} MB`;
};

export const AuditPanel = ({ endpoint, children }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    setLoading(true);
    setError("");

    fetch(endpoint, { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || payload.error) {
          throw new Error(payload.details || payload.error || "Fetch failed");
        }
        return payload;
      })
      .then((payload) => {
        if (!ignore) setData(payload);
      })
      .catch((err) => {
        if (!ignore) setError(err.message || "Fetch failed");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [endpoint]);

  if (loading) {
    return (
      <Card className="min-h-40 center">
        <Spinner type="logo" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <p className="text-sm text-red-400">{error}</p>
      </Card>
    );
  }

  return children(data);
};

const StatusPair = ({ approved, pending }) => (
  <div className="flex flex-wrap items-center gap-2">
    <Badge value={approved} color="green" />
    <span className="secondary text-xs text-cream/70">Approved</span>
    <Badge value={pending} color="yellow" />
    <span className="secondary text-xs text-cream/70">Pending</span>
  </div>
);

const ImageHealth = ({ stats }) => {
  if (!stats) return null;

  const { total, optimized, single, legacy, missing } = stats;
  const pct = (value) => (total > 0 ? Math.round((value / total) * 100) : 0);
  const segments = [
    { label: "optimized", value: optimized, color: "bg-green-500" },
    { label: "single", value: single, color: "bg-yellow-400" },
    { label: "legacy", value: legacy, color: "bg-orange-400" },
    { label: "missing", value: missing, color: "bg-red-500/60" },
  ];

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-neutral-800 gap-px">
        {segments.map((segment) =>
          segment.value > 0 ? (
            <div
              key={segment.label}
              style={{ width: `${pct(segment.value)}%` }}
              className={segment.color}
              title={`${segment.label}: ${segment.value}`}
            />
          ) : null,
        )}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
        {segments.map((segment) => (
          <span
            key={segment.label}
            className="secondary flex items-center gap-1 text-[10px] capitalize text-cream/50"
          >
            <span
              className={`inline-block h-2 w-2 rounded-sm ${segment.color}`}
            />
            {segment.label} ({segment.value})
          </span>
        ))}
      </div>
    </div>
  );
};

const DateStatus = ({ upcoming, past }) => (
  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
    <div className="flex items-center gap-1.5">
      <span className="inline-block h-2 w-2 rounded-full bg-green-400" />
      <span className="secondary text-xs text-cream/60">
        Upcoming:{" "}
        <span className="font-bold text-cream">
          {upcoming?.toLocaleString() ?? "-"}
        </span>
      </span>
    </div>
    <div className="flex items-center gap-1.5">
      <span className="inline-block h-2 w-2 rounded-full bg-neutral-500" />
      <span className="secondary text-xs text-cream/60">
        Past:{" "}
        <span className="font-bold text-cream">
          {past?.toLocaleString() ?? "-"}
        </span>
      </span>
    </div>
  </div>
);

export const ContentStatsCard = ({ title, stats, showDateStatus = false }) => (
  <Card className="flex flex-col justify-between gap-3">
    <SectionTitle text={title} />
    <StatRow label="Total" value={stats.total} accent />
    <div className="min-h-16">
      <StatusPair approved={stats.approved} pending={stats.pending} />
      {showDateStatus && (
        <DateStatus upcoming={stats.upcoming} past={stats.past} />
      )}
    </div>
    <div className="mt-1 border-t border-gold/10 pt-2">
      <p className="secondary mb-1 text-[10px] font-bold uppercase tracking-widest text-chino">
        Image Health
      </p>
      <ImageHealth stats={stats.images} />
    </div>
  </Card>
);
