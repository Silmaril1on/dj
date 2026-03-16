import Paragraph from "@/app/components/ui/Paragraph";
import Title from "@/app/components/ui/Title";
import { getActivityStatCounts } from "@/app/lib/services/user/activities/getActivityStatCounts";
import { FaHeart, FaStar, FaComment, FaCalendarAlt } from "react-icons/fa";

const STAT_ITEMS = [
  { key: "totalReviews", label: "Reviews", Icon: FaComment },
  { key: "totalRatings", label: "Ratings", Icon: FaStar },
  { key: "totalArtistLikes", label: "Artist Likes", Icon: FaHeart },
  { key: "totalTrackedEvents", label: "Events Tracked", Icon: FaCalendarAlt },
  {
    key: "totalSubmittedEvents",
    label: "Submitted Events",
    Icon: FaCalendarAlt,
  },
];

const ActivityHeader = async ({
  title = "My Activities",
  description = "Track your reviews, ratings, and interactions throughout the platform.",
  showStats = true,
  className = "",
}) => {
  let counts = null;
  if (showStats) {
    try {
      counts = await getActivityStatCounts();
    } catch {
      // unauthenticated or fetch error — render header without counts
    }
  }

  return (
    <div
      className={`w-full flex items-center justify-start pl-3 lg:pl-10 bg-gold/40 py-20 ${className}`}
    >
      <div className="space-y-4">
        <div>
          <Title text={title} size="3xl" />
          <Paragraph text={description} />
        </div>

        {counts && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-1">
            {STAT_ITEMS.map(({ key, label, Icon }) => {
              const value = counts[key] ?? 0;
              if (key === "totalSubmittedEvents" && value === 0) return null;
              return (
                <div
                  key={key}
                  className="flex items-center gap-2 bg-stone-900/80 px-4 py-2 rounded-lg border border-gold/20"
                >
                  <Icon className="text-gold" size={16} />
                  <span className="text-gold font-bold">{value}</span>
                  <span className="text-stone-400 text-sm">{label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityHeader;
