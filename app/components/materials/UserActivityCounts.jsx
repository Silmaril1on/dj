'use client'
import { useState, useEffect } from 'react'
import { FaHeart, FaStar, FaComment } from 'react-icons/fa'

const UserActivityCounts = ({ showStats = true, className = "" }) => {
    const [stats, setStats] = useState({
        totalReviews: 0,
        totalRatings: 0,
        totalLikes: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await fetch('/api/users/activity-stats', {
                    method: 'GET',
                    cache: 'no-store',
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                if (data.success) {
                    setStats(data.data);
                } else {
                    throw new Error(data.error || 'Failed to fetch stats');
                }
            } catch (err) {
                console.error('Error fetching activity stats:', err);
                setError(err.message);
                setStats({
                    totalReviews: 0,
                    totalRatings: 0,
                    totalLikes: 0
                });
            } finally {
                setLoading(false);
            }
        };

        if (showStats) {
            fetchStats();
        } else {
            setLoading(false);
        }
    }, [showStats]);

    if (!showStats) {
        return null;
    }

    return (
        <div className={`flex gap-3 mt-6 ${className}`}>
            <div className="flex items-center gap-2 bg-stone-800/50 px-4 py-2 rounded-lg border border-gold/20">
                <FaComment className="text-gold" size={16} />
                <span className="text-gold font-bold">
                    {loading ? '...' : stats.totalReviews}
                </span>
                <span className="text-stone-400 text-sm">Reviews</span>
            </div>

            <div className="flex items-center gap-2 bg-stone-800/50 px-4 py-2 rounded-lg border border-gold/20">
                <FaStar className="text-gold" size={16} />
                <span className="text-gold font-bold">
                    {loading ? '...' : stats.totalRatings}
                </span>
                <span className="text-stone-400 text-sm">Ratings</span>
            </div>

            <div className="flex items-center gap-2 bg-stone-800/50 px-4 py-2 rounded-lg border border-gold/20">
                <FaHeart className="text-gold" size={16} />
                <span className="text-gold font-bold">
                    {loading ? '...' : stats.totalLikes}
                </span>
                <span className="text-stone-400 text-sm">Likes</span>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mt-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg">
                    <p className="text-red-300 text-sm">
                        Failed to load activity stats: {error}
                    </p>
                </div>
            )}
        </div>
    )
}

export default UserActivityCounts