import Link from "next/link";
import FlexBox from "@/app/components/containers/FlexBox";
import Motion from "@/app/components/containers/Motion";
import Dot from "@/app/components/ui/Dot";
import Title from "@/app/components/ui/Title";

const ArtistTitle = ({ name, artistSlug, className }) => {
  const titleEl = (
    <Title
      size="xl"
      color="cream"
      className={`${className} ${artistSlug ? "cursor-pointer hover:text-gold transition-colors" : "brightness-80 cursor-default"}`}
      text={name}
      showLive={true}
    />
  );
  return artistSlug ? (
    <Link href={`/artists/${artistSlug}`}>{titleEl}</Link>
  ) : (
    titleEl
  );
};

const Badge = ({ label }) => (
  <div className="text-[7px] md:text-[10px] uppercase text-cream self-start pt-[2px]">
    {label}
  </div>
);

const ProfileLineup = ({ title = "Lineup", data = [] }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="lg:w-5xl lg:py-3">
      <div className="pl-2">
        <Title text={title} size="sm" color="chino" className="font-normal " />
        <FlexBox type="row-start" className="flex-wrap lg:gap-2 items-center">
          {data.map((artist, index) => {
            const isString = typeof artist === "string";
            const artistName = isString ? artist : artist.name;
            const artistSlug = isString ? null : artist.artist_slug;
            const b2bParts = isString ? null : artist.b2bParts;

            return (
              <Motion
                animation="fade"
                delay={index * 0.2}
                key={index}
                className="flex items-center gap-1"
              >
                {b2bParts ? (
                  // B2B artist — render each part with its own link
                  <div className="flex items-baseline gap-1">
                    {b2bParts.map((part, i) => (
                      <div key={i} className="flex items-baseline gap-1">
                        <ArtistTitle
                          name={part.name}
                          artistSlug={part.artist_slug}
                          className="uppercase leading-none"
                        />
                        {i < b2bParts.length - 1 && <Badge label="B2B" />}
                      </div>
                    ))}
                  </div>
                ) : (
                  <ArtistTitle
                    name={artistName}
                    artistSlug={artistSlug}
                    className="uppercase leading-none"
                  />
                )}
                {index < data.length - 1 && <Dot className="pr-1" />}
              </Motion>
            );
          })}
        </FlexBox>
      </div>
    </div>
  );
};

export default ProfileLineup;
