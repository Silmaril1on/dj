"use client"
import { FaArrowUp, FaArrowDown, FaMinus } from "react-icons/fa";
import SectionContainer from "@/app/components/containers/SectionContainer";
import ArtistName from "@/app/components/materials/ArtistName";

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

  return (
    <SectionContainer size="sm" title="Top Weekly Artists" description="Weekly comparison chart for artists rating" className=" bg-stone-900">
      <div className="w-full">
        <div className="space-y-2">
          {thisWeek.map((artist, idx) => (
            <div key={artist.id} className="flex items-center gap-3">
              <div className="w-12 h-12 rounded overflow-hidden bg-stone-800 flex-shrink-0">
                <img
                  src={artist.artist_image}
                  alt={artist.stage_name || artist.name}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="flex-1">
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
                <div className="flex gap-2 mt-1 text-xs text-stone-400">
                  <span>
                    Rating: 
                    <span className="text-gold">{artist.allTimeAverage}</span>
                  </span>
                  <span>
                    Total ratings:{" "}
                    <span className="text-gold">{artist.allTimeTotal}</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <h4 className="text-chino text-md mb-2">Previous Week</h4>
          <div className="space-y-4">
            {previousWeek.map((artist, idx) => (
              <div key={artist.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded overflow-hidden bg-stone-800 flex-shrink-0">
                  <img
                    src={artist.artist_image}
                    alt={artist.stage_name || artist.name}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="flex-1">
                  <span className="font-bold text-chino text-xs">
                    {artist.stage_name || artist.name}
                  </span>
                  <span className="ml-2 text-xs text-chino">
                    {artist.weeklyAverage}
                  </span>
                  <span className="ml-2 text-xs text-stone-400">
                    ({artist.weeklyRatingCount} ratings)
                  </span>
                </div>
                <div className="ml-2 text-xs text-stone-400">
                  #{artist.rank}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionContainer>
  );
};

export default SideContent;