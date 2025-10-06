"use client"
import { FaArrowUp, FaArrowDown, FaMinus } from "react-icons/fa";
import SectionContainer from "@/app/components/containers/SectionContainer";
import ArtistName from "@/app/components/materials/ArtistName";
import ProfilePicture from "@/app/components/materials/ProfilePicture";
import SpanText from "@/app/components/ui/SpanText";
import Motion from "@/app/components/containers/Motion";
import Title from "@/app/components/ui/Title";

const getChangeIcon = (changeType) => {
  if (changeType === "up")
    return <FaArrowUp className="text-green-400 ml-1" />;
  if (changeType === "down")
    return <FaArrowDown className="text-red-400 ml-1" />;
  if (changeType === "new")
    return <FaMinus className="text-yellow-400 ml-1" />;
  return null;
};

const SideContent = ({ thisWeek = [], previousWeek = [] }) => {

  console.log(thisWeek);
  

  return (
    <SectionContainer
      size="sm"
      title="Top Weekly Artists"
      description="Weekly comparison chart for artists rating"
      className=" bg-stone-900"
    >
      <div className="w-full">
        <div className="space-y-2">
          <Title text="Current Week" size="xs" color="cream" />
          {thisWeek.map((artist, idx) => (
            <Motion
              animation="fade"
              delay={idx * 0.07}
              key={artist.id}
              className="flex items-center gap-2 px-2 py-1 bg-stone-950/40"
            >
              <ProfilePicture avatar_url={artist.artist_image} />
              <div className="grid grid-cols-3 w-full">
                <ArtistName artistName={artist} size="xs" />
                <div className="flex items-center gap-2 mt-1">
                  <span className="ml-2 text-xs text-gold">
                    {artist.weeklyAverage}
                  </span>
                  <span className="ml-2 text-xs text-stone-400">
                    ({artist.weeklyRatingCount} ratings)
                  </span>
                  {getChangeIcon(artist.changeType)}
                  {artist.changeType !== "new" && artist.change !== 0 && (
                    <span
                      className={`ml-1 text-xs ${
                        artist.change > 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {artist.change > 0 ? `+${artist.change}` : artist.change}
                    </span>
                  )}
                  {artist.changeType === "new" && (
                    <span className="ml-1 text-xs text-yellow-400">New</span>
                  )}
                </div>
                <div className="flex flex-col items-end">
                  <SpanText text="Rating:" size="xs">
                    <span className="text-chino font-bold">
                      {artist.allTimeAverage}
                    </span>
                  </SpanText>
                  <SpanText text="Total ratings:" size="xs">
                    <span className="text-chino font-bold">
                      {artist.allTimeTotal}
                    </span>
                  </SpanText>
                </div>
              </div>
            </Motion>
          ))}
        </div>
        <div className=" space-y-3 mt-5">
          <Title text="Previous Week" size="xs" color="cream" />
          <div className="space-y-2">
            {previousWeek.map((artist, idx) => (
              <Motion
                animation="fade"
                delay={idx * 0.07}
                key={artist.id}
                className="flex items-center gap-2 bg-stone-950/40 px-2 py-1"
              >
                <ProfilePicture avatar_url={artist.artist_image} />
                <div className="flex-1 grid grid-cols-3">
                  <ArtistName artistName={artist} size="xs" />
                 <SpanText text={artist.weeklyAverage} size="xs" />
                  <span className="ml-2 text-xs text-stone-400">
                    ({artist.weeklyRatingCount} ratings)
                  </span>
                </div>
                <div className="ml-2 text-xs text-stone-400">
                  #{artist.rank}
                </div>
              </Motion>
            ))}
          </div>
        </div>
      </div>
    </SectionContainer>
  );
};

export default SideContent;