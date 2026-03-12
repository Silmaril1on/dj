"use client";
import { useState, useEffect } from "react";
import { FaHeart, FaStar, FaComment, FaCalendarAlt } from "react-icons/fa";

const CACHE_KEY = "user-activity-stats";
const CACHE_TTL_MS = 10 * 60 * 1000;

const UserActivityCounts = ({ showStats = true, className = "" }) => {
  const [stats, setStats] = useState({
    totalReviews: 0,
    totalRatings: 0,
    totalArtistLikes: 0,
    totalTrackedEvents: 0,
    totalLikes: 0,
    totalEvents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasCache, setHasCache] = useState(false);

  useEffect(() => {
    const readCache = () => {
      try {
        const cachedRaw = localStorage.getItem(CACHE_KEY);
        if (!cachedRaw) return;
        const cached = JSON.parse(cachedRaw);
        if (cached?.data && cached?.ts) {
          const isFresh = Date.now() - cached.ts < CACHE_TTL_MS;
          if (isFresh) {
            setStats(cached.data);
            setHasCache(true);
            setLoading(false);
          }
        }
      } catch (cacheError) {
        console.warn("Failed to read activity stats cache", cacheError);
      }
    };

    const writeCache = (data) => {
      try {
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ ts: Date.now(), data }),
        );
      } catch (cacheError) {
        console.warn("Failed to write activity stats cache", cacheError);
      }
    };

    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/users/activity-stats", {
          method: "GET",
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.success) {
          setStats(data.data);
          writeCache(data.data);
        } else {
          throw new Error(data.error || "Failed to fetch stats");
        }
      } catch (err) {
        console.error("Error fetching activity stats:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (showStats) {
      readCache();
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [showStats]);

  if (!showStats) {
    return null;
  }

  return (
    <div className={`grid grid-cols-2 lg:grid-cols-5 gap-1 ${className}`}>
      <div className="flex items-center gap-2 bg-stone-900/80 px-4 py-2 rounded-lg border border-gold/20">
        <FaComment className="text-gold" size={16} />
        <span className="text-gold font-bold">
          {loading && !hasCache ? "..." : stats.totalReviews}
        </span>
        <span className="text-stone-400 text-sm">Reviews</span>
      </div>

      <div className="flex items-center gap-2 bg-stone-900/80 px-4 py-2 rounded-lg border border-gold/20">
        <FaStar className="text-gold" size={16} />
        <span className="text-gold font-bold">
          {loading && !hasCache ? "..." : stats.totalRatings}
        </span>
        <span className="text-stone-400 text-sm">Ratings</span>
      </div>

      <div className="flex items-center gap-2 bg-stone-900/80 px-4 py-2 rounded-lg border border-gold/20">
        <FaHeart className="text-gold" size={16} />
        <span className="text-gold font-bold">
          {loading && !hasCache ? "..." : stats.totalArtistLikes || 0}
        </span>
        <span className="text-stone-400 text-sm">Artist Likes</span>
      </div>

      <div className="flex items-center gap-2 bg-stone-900/80 px-4 py-2 rounded-lg border border-gold/20">
        <FaHeart className="text-gold" size={16} />
        <span className="text-gold font-bold">
          {loading && !hasCache ? "..." : stats.totalTrackedEvents || 0}
        </span>
        <span className="text-stone-400 text-sm">Events Tracked</span>
      </div>

      {stats.totalEvents > 0 && (
        <div className="flex items-center gap-2 bg-stone-900/80 px-4 py-2 rounded-lg border border-gold/20">
          <FaCalendarAlt className="text-gold" size={16} />
          <span className="text-gold font-bold">
            {loading && !hasCache ? "..." : stats.totalEvents}
          </span>
          <span className="text-stone-400 text-sm">Submitted Events</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg">
          <p className="text-red-300 text-sm">
            Failed to load activity stats: {error}
          </p>
        </div>
      )}
    </div>
  );
};

export default UserActivityCounts;
