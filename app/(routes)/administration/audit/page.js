"use client";
import { useEffect, useState } from "react";
import Spinner from "@/app/components/ui/Spinner";

// ── Primitives ───────────────────────────────────────────────────────────────

const Card = ({ children, className = "" }) => (
  <div
    className={`bg-neutral-900 border border-gold/20 p-5 flex flex-col gap-3 ${className}`}
  >
    {children}
  </div>
);

const SectionTitle = ({ text }) => (
  <h2 className="text-gold font-bold uppercase tracking-widest text-xs border-b border-gold/20 pb-1 mb-1">
    {text}
  </h2>
);

const StatRow = ({ label, value, accent = false }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-cream/60">{label}</span>
    <span className={`font-bold tabular-nums ${accent ? "text-gold" : "text-cream"}`}>
      {value?.toLocaleString() ?? "—"}
    </span>
  </div>
);

const Badge = ({ value, color = "gold" }) => {
  const colors = {
    gold: "bg-gold/20 text-gold",
    green: "bg-green-500/20 text-green-400",
    yellow: "bg-yellow-500/20 text-yellow-400",
    red: "bg-red-500/20 text-red-400",
    blue: "bg-blue-500/20 text-blue-400",
  };
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded ${colors[color]}`}>
      {value?.toLocaleString() ?? "—"}
    </span>
  );
};

const StatusPair = ({ approved, pending }) => (
  <div className="flex items-center gap-2">
    <Badge value={approved} color="green" />
    <span className="text-cream/30 text-xs">approved</span>
    <Badge value={pending} color="yellow" />
    <span className="text-cream/30 text-xs">pending</span>
  </div>
);

// Tiny sparkline bar chart (no external library)
const Sparkline = ({ series }) => {
  if (!series?.length) return null;
  const max = Math.max(...series.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-px h-12 w-full">
      {series.map((d, i) => {
        const pct = Math.max((d.count / max) * 100, d.count > 0 ? 6 : 2);
        return (
          <div
            key={i}
            title={`${d.date}: ${d.count}`}
            style={{ height: `${pct}%` }}
            className={`flex-1 rounded-t-sm ${d.count > 0 ? "bg-gold/70" : "bg-neutral-700"} transition-all`}
          />
        );
      })}
    </div>
  );
};

// Image health bar
const ImageHealth = ({ stats }) => {
  if (!stats) return null;
  const { total, optimized, single, legacy, missing } = stats;
  const pct = (n) => (total > 0 ? Math.round((n / total) * 100) : 0);
  const segments = [
    { label: "optimized", val: optimized, color: "bg-green-500" },
    { label: "single", val: single, color: "bg-yellow-400" },
    { label: "legacy", val: legacy, color: "bg-orange-400" },
    { label: "missing", val: missing, color: "bg-red-500/60" },
  ];
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-neutral-800 gap-px">
        {segments.map((s) =>
          s.val > 0 ? (
            <div
              key={s.label}
              style={{ width: `${pct(s.val)}%` }}
              className={`${s.color}`}
              title={`${s.label}: ${s.val}`}
            />
          ) : null,
        )}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
        {segments.map((s) => (
          <span key={s.label} className="text-[10px] text-cream/50 flex items-center gap-1">
            <span className={`inline-block w-2 h-2 rounded-sm ${s.color}`} />
            {s.label} ({s.val})
          </span>
        ))}
      </div>
    </div>
  );
};

// Horizontal bar for top items list
const TopBar = ({ label, count, max }) => {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-cream/70 w-32 truncate shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
        <div
          style={{ width: `${pct}%` }}
          className="h-full bg-gold/60 rounded-full"
        />
      </div>
      <span className="text-cream/50 w-8 text-right tabular-nums">{count}</span>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

const Audit = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/admin/audit")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center flex-col gap-4">
        <Spinner type="logo" />
        <p className="text-cream/50 text-sm">Loading audit data…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  const { users, artists, clubs, festivals, events, news, bookings, reviews } =
    data;

  const contentTotal =
    (artists.total || 0) +
    (clubs.total || 0) +
    (festivals.total || 0) +
    (events.total || 0);

  const maxGenre = Math.max(...(artists.topGenres || []).map((g) => g.count), 1);
  const maxArtistCountry = Math.max(
    ...(artists.topCountries || []).map((c) => c.count),
    1,
  );
  const maxClubCountry = Math.max(
    ...(clubs.topCountries || []).map((c) => c.count),
    1,
  );

  const generatedAt = data.generatedAt
    ? new Date(data.generatedAt).toLocaleString()
    : null;

  return (
    <div className="min-h-screen bg-black p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-gold font-bold text-2xl lg:text-3xl uppercase tracking-wider">
            Platform Audit
          </h1>
          <p className="text-cream/40 text-xs mt-1">
            {generatedAt ? `Generated ${generatedAt}` : "Live data"}
          </p>
        </div>
        <button
          onClick={() => { setLoading(true); setError(null); setData(null);
            fetch("/api/admin/audit").then(r => r.json()).then(d => { if (d.error) throw new Error(d.error); setData(d); }).catch(e => setError(e.message)).finally(() => setLoading(false)); }}
          className="text-xs border border-gold/30 text-gold px-3 py-1.5 hover:bg-gold/10 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* ── Overview strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Total Content", value: contentTotal, color: "gold" },
          { label: "Artists", value: artists.total, color: "gold" },
          { label: "Clubs", value: clubs.total, color: "gold" },
          { label: "Festivals", value: festivals.total, color: "gold" },
          { label: "Events", value: events.total, color: "gold" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-neutral-900 border border-gold/20 p-4 flex flex-col gap-1"
          >
            <span className="text-cream/50 text-[10px] uppercase tracking-widest">
              {s.label}
            </span>
            <span className="text-gold font-bold text-2xl tabular-nums">
              {s.value?.toLocaleString() ?? "—"}
            </span>
          </div>
        ))}
      </div>

      {/* ── Users ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card>
          <SectionTitle text="Users" />
          <StatRow label="Total registered" value={users.total} accent />
          <StatRow label="New today" value={users.today} />
          <StatRow label="New last 7 days" value={users.lastWeek} />
          <StatRow label="New last 30 days" value={users.lastMonth} />
        </Card>
        <Card>
          <SectionTitle text="Signups — last 14 days" />
          <Sparkline series={users.signupSeries} />
          <div className="flex justify-between text-[10px] text-cream/30 mt-1">
            {users.signupSeries?.length > 0 && (
              <>
                <span>{users.signupSeries[0].date}</span>
                <span>{users.signupSeries[users.signupSeries.length - 1].date}</span>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* ── Engagement ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card>
          <SectionTitle text="Booking Requests" />
          <StatRow label="Total" value={bookings.total} accent />
          <StatRow label="Pending" value={bookings.pending} />
          <StatRow label="Approved" value={bookings.approved} />
          <StatRow label="Declined" value={bookings.declined} />
        </Card>
        <Card>
          <SectionTitle text="Reviews" />
          <StatRow label="Total" value={reviews.total} accent />
          <StatRow label="Last 7 days" value={reviews.lastWeek} />
        </Card>
        <Card>
          <SectionTitle text="News" />
          <StatRow label="Total articles" value={news.total} accent />
        </Card>
      </div>

      {/* ── Artists ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card>
          <SectionTitle text="Artists" />
          <StatRow label="Total" value={artists.total} accent />
          <StatusPair approved={artists.approved} pending={artists.pending} />
          <div className="border-t border-gold/10 pt-2 mt-1">
            <p className="text-[10px] text-cream/40 uppercase tracking-widest mb-1">
              Image Health
            </p>
            <ImageHealth stats={artists.images} />
          </div>
        </Card>
        <Card>
          <SectionTitle text="Top Genres" />
          <div className="space-y-2">
            {artists.topGenres?.map((g) => (
              <TopBar key={g.genre} label={g.genre} count={g.count} max={maxGenre} />
            ))}
          </div>
        </Card>
        <Card>
          <SectionTitle text="Artists by Country" />
          <div className="space-y-2">
            {artists.topCountries?.map((c) => (
              <TopBar key={c.country} label={c.country} count={c.count} max={maxArtistCountry} />
            ))}
          </div>
        </Card>
      </div>

      {/* ── Clubs ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card>
          <SectionTitle text="Clubs" />
          <StatRow label="Total" value={clubs.total} accent />
          <StatusPair approved={clubs.approved} pending={clubs.pending} />
          <div className="border-t border-gold/10 pt-2 mt-1">
            <p className="text-[10px] text-cream/40 uppercase tracking-widest mb-1">
              Image Health
            </p>
            <ImageHealth stats={clubs.images} />
          </div>
        </Card>
        <Card>
          <SectionTitle text="Clubs by Country" />
          <div className="space-y-2">
            {clubs.topCountries?.map((c) => (
              <TopBar key={c.country} label={c.country} count={c.count} max={maxClubCountry} />
            ))}
          </div>
        </Card>
      </div>

      {/* ── Festivals ── */}
      <Card>
        <SectionTitle text="Festivals" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <StatRow label="Total" value={festivals.total} accent />
            <StatusPair approved={festivals.approved} pending={festivals.pending} />
          </div>
          <div>
            <p className="text-[10px] text-cream/40 uppercase tracking-widest mb-2">
              Image Health
            </p>
            <ImageHealth stats={festivals.images} />
          </div>
        </div>
      </Card>

      {/* ── Events ── */}
      <Card>
        <SectionTitle text="Events" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <StatRow label="Total" value={events.total} accent />
            <StatusPair approved={events.approved} pending={events.pending} />
            <div className="flex items-center gap-4 pt-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                <span className="text-xs text-cream/60">
                  Upcoming:{" "}
                  <span className="text-cream font-bold">
                    {events.upcoming?.toLocaleString()}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-neutral-500 inline-block" />
                <span className="text-xs text-cream/60">
                  Past:{" "}
                  <span className="text-cream font-bold">
                    {events.past?.toLocaleString()}
                  </span>
                </span>
              </div>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-cream/40 uppercase tracking-widest mb-2">
              Image Health
            </p>
            <ImageHealth stats={events.images} />
          </div>
        </div>
      </Card>

      {/* ── Image health summary ── */}
      <Card>
        <SectionTitle text="Storage / Image Optimization Summary" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {[
            { label: "Artists", stats: artists.images },
            { label: "Clubs", stats: clubs.images },
            { label: "Festivals", stats: festivals.images },
            { label: "Events", stats: events.images },
          ].map(({ label, stats }) => {
            const ratio =
              stats?.total > 0
                ? Math.round((stats.optimized / stats.total) * 100)
                : 0;
            return (
              <div key={label} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-cream/70 text-xs font-semibold">{label}</span>
                  <span
                    className={`text-xs font-bold ${ratio >= 80 ? "text-green-400" : ratio >= 50 ? "text-yellow-400" : "text-red-400"}`}
                  >
                    {ratio}% optimized
                  </span>
                </div>
                <ImageHealth stats={stats} />
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-cream/30 mt-1">
          "optimized" = sm/md/lg variants differ · "single" = same URL for all
          sizes · "legacy" = plain string URL · "missing" = no image
        </p>
      </Card>
    </div>
  );
};

export default Audit;

