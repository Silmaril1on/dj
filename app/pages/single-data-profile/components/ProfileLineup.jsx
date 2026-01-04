import Link from "next/link";
import FlexBox from "@/app/components/containers/FlexBox";
import Motion from "@/app/components/containers/Motion";
import Dot from "@/app/components/ui/Dot";
import Title from "@/app/components/ui/Title";

const ProfileLineup = ({ title = "Lineup", data = [] }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="pl-2">
      <Title text={title} size="sm" color="chino" className="font-normal " />
      <FlexBox type="row-start" className="flex-wrap lg:gap-2 items-center">
        {data.map((artist, index) => {
          // Handle both string (legacy) and object (with ID) formats
          const artistName = typeof artist === "string" ? artist : artist.name;
          const artistId = typeof artist === "object" ? artist.id : null;

          return (
            <Motion
              animation="fade"
              delay={index * 0.2}
              key={index}
              className="flex items-center space-x-2"
            >
              {artistId ? (
                <Link href={`/artists/${artistId}`}>
                  <Title
                    size="xl"
                    color="cream"
                    className="uppercase leading-none cursor-pointer hover:text-gold transition-colors"
                    text={artistName}
                  />
                </Link>
              ) : (
                <Title
                  size="xl"
                  color="cream"
                  className="uppercase leading-none brightness-80 cursor-default"
                  text={artistName}
                />
              )}
              {index < data.length - 1 && <Dot />}
            </Motion>
          );
        })}
      </FlexBox>
    </div>
  );
};

export default ProfileLineup;
