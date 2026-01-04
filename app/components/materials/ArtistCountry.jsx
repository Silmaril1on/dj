import { CountryFlags } from "./CountryFlags";
import FlexBox from "../containers/FlexBox";
import Dot from "../ui/Dot";

const ArtistCountry = ({ artistCountry }) => {
  // Check if city should be displayed
  const hasValidCity =
    artistCountry?.city && artistCountry.city.toLowerCase() !== "not specified";

  return (
    <FlexBox type="row-start" className="items-center text-gold">
      <CountryFlags
        style={{ width: "16px", height: "16px" }}
        countryName={artistCountry.country}
      />
      <FlexBox
        type="row-start"
        className="secondary text-[9px] md:text-xs gap-1 pl-1 capitalize items-center *:leading-none"
      >
        {artistCountry.country && <p>{artistCountry.country}</p>}
        {hasValidCity && <Dot />}
        {hasValidCity && <p>{artistCountry.city}</p>}
      </FlexBox>
    </FlexBox>
  );
};

export default ArtistCountry;
