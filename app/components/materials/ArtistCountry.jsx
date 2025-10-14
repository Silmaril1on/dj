import { CountryFlags } from './CountryFlags'
import FlexBox from '../containers/FlexBox'
import Dot from '../ui/Dot'
import { truncateString } from '@/app/helpers/utils'

const ArtistCountry = ({ artistCountry }) => {
  return (
    <FlexBox type="row-start" className="items-center text-gold">
      <CountryFlags
        style={{ width: "16px", height: "16px" }}
        countryName={artistCountry.country}
      />
      <FlexBox
        type="row-start"
        className="secondary text-xs gap-1 pl-1 capitalize items-center *:leading-none"
      >
        {artistCountry.country && <p>{artistCountry.country}</p>}
        {artistCountry.city && <Dot />}
        {artistCountry.city && <p>{truncateString(artistCountry.city, 12)}</p>}
      </FlexBox>
    </FlexBox>
  );
}

export default ArtistCountry