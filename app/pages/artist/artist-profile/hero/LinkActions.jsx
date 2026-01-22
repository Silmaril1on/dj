"use client";
import { useSelector } from "react-redux";
import { selectArtistRatingStats } from "@/app/features/ratingSlice";
import FlexBox from "@/app/components/containers/FlexBox";
import Motion from "@/app/components/containers/Motion";

const LinkActions = ({ data }) => {
  const { likesCount, rating_stats, scheduleCount } = data;
  const reduxStats = useSelector(selectArtistRatingStats(data.id));
  const scores = reduxStats || rating_stats;

  return (
    <div className="grow-1 grid grid-cols-1 md:grid-cols-2 gap-4">
      <Scores
        scores={scores}
        likesCount={likesCount}
        scheduleCount={scheduleCount || 0}
      />
    </div>
  );
};

const Scores = ({ scores, likesCount, scheduleCount }) => {
  const scoreData = [
    {
      id: "listeners-score",
      value: scores?.average_score,
      title: "Listeners score",
      description: `${scores?.total_ratings} ${scores?.total_ratings === 1 ? "user" : "users"} has rates`,
      delay: 0.2,
    },
    {
      id: "popularity-score",
      value: likesCount,
      title: "Popularity Score",
      description: `${likesCount} ${likesCount === 1 ? "user" : "users"} like this artist`,
      delay: 0.4,
    },
    {
      id: "upcoming-dates",
      value: scheduleCount,
      title: "Upcoming Dates",
      description: `${scheduleCount} ${scheduleCount === 1 ? "date" : "dates"} scheduled`,
      delay: 0.6,
    },
  ];

  return (
    <div className="space-y-2 *:font-bold pointer-events-none">
      {scoreData.map((item) => (
        <Motion
          key={item.id}
          animation="fade"
          delay={item.delay}
          className="space-x-2 flex items-center"
        >
          <span className="bg-gold/20  center text-gold text-5xl px-3 pt-2 rounded-md min-w-19">
            {item.value}
          </span>
          <div className="flex flex-col *:leading-none">
            <span className="text-lg text-gold">{item.title}</span>
            <span className="text-chino italic text-xs font-normal secondary">
              {item.description}
            </span>
          </div>
        </Motion>
      ))}
    </div>
  );
};

export default LinkActions;
