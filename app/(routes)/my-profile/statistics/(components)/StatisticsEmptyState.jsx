"use client";
import Motion from "@/app/components/containers/Motion";
import { MdStarRate, MdEvent, MdFestival, MdBookmark } from "react-icons/md";
import { FaRegStar, FaHeart, FaNewspaper } from "react-icons/fa";
import { SiYoutubemusic, SiNeteasecloudmusic } from "react-icons/si";
import { TbChartBar } from "react-icons/tb";

const actions = [
  {
    icon: <FaRegStar />,
    label: "Rate Artists",
    description: "Rate DJs and artists to unlock your ratings breakdown.",
  },
  {
    icon: <MdStarRate />,
    label: "Write Reviews",
    description:
      "Leave reviews on artist profiles to build your review history.",
  },
  {
    icon: <FaHeart />,
    label: "Like Artists",
    description: "Like your favourite artists to track them here.",
  },
  {
    icon: <SiYoutubemusic />,
    label: "Submit an Artist",
    description: "Submit an artist profile to manage and monitor it.",
  },
  {
    icon: <SiNeteasecloudmusic />,
    label: "Register a Club",
    description: "Add a club to see its stats and activity at a glance.",
  },
  {
    icon: <MdEvent />,
    label: "Submit Events",
    description: "Create events and watch your submissions stack up.",
  },
  {
    icon: <MdFestival />,
    label: "Add a Festival",
    description: "Submit a festival profile to track its reach.",
  },
  {
    icon: <MdBookmark />,
    label: "Make Bookings",
    description: "Send booking requests to artists and follow your history.",
  },
];

const StatisticsEmptyState = () => {
  return (
    <Motion
      animation="fade"
      className="w-full flex flex-col items-center justify-center py-16 px-4 gap-10"
    >
      {/* Header */}
      <div className="flex flex-col items-center gap-3 text-center max-w-xl">
        <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold text-2xl">
          <TbChartBar />
        </div>
        <h2 className="text-2xl font-bold text-gold leading-tight">
          Nothing to show yet
        </h2>
        <p className="text-chino/70 text-sm secondary leading-relaxed">
          Your statistics page will come alive once you start engaging with the
          platform. Here&apos;s what you can do to fill it up:
        </p>
      </div>

      {/* Action cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-4xl">
        {actions.map(({ icon, label, description }, i) => (
          <Motion
            key={label}
            animation="fade"
            delay={i * 0.05}
            className="flex flex-col gap-2 bg-stone-900 border border-gold/10 rounded-lg p-4 hover:border-gold/30 transition-colors duration-200"
          >
            <div className="text-gold text-xl">{icon}</div>
            <p className="text-cream text-sm font-semibold leading-tight">
              {label}
            </p>
            <p className="text-chino/60 text-[11px] secondary leading-relaxed">
              {description}
            </p>
          </Motion>
        ))}
      </div>
    </Motion>
  );
};

export default StatisticsEmptyState;
