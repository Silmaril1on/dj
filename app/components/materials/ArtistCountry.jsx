import { CountryFlags, getCountryCode } from "./CountryFlags";
import FlexBox from "../containers/FlexBox";
import Dot from "../ui/Dot";

const ArtistCountry = ({ artistCountry, className, size }) => {
  // Check if city should be displayed
  const hasValidCity =
    artistCountry?.city && artistCountry.city.toLowerCase() !== "not specified";

  // Get full country name - handles both country codes and full names
  const getCountryName = (country) => {
    if (!country) return "";

    // If it's 2 characters, it's likely a country code
    if (country.length === 2) {
      const countryMap = {
        US: "United States",
        GB: "United Kingdom",
        NL: "Netherlands",
        DE: "Germany",
        FR: "France",
        ES: "Spain",
        IT: "Italy",
        SE: "Sweden",
        NO: "Norway",
        DK: "Denmark",
        FI: "Finland",
        BE: "Belgium",
        CH: "Switzerland",
        AT: "Austria",
        IE: "Ireland",
        PT: "Portugal",
        GR: "Greece",
        PL: "Poland",
        CZ: "Czech Republic",
        HU: "Hungary",
        UA: "Ukraine",
        RO: "Romania",
        BG: "Bulgaria",
        HR: "Croatia",
        SK: "Slovakia",
        SI: "Slovenia",
        EE: "Estonia",
        LV: "Latvia",
        LT: "Lithuania",
        LU: "Luxembourg",
        MT: "Malta",
        CY: "Cyprus",
        AU: "Australia",
        NZ: "New Zealand",
        CA: "Canada",
        MX: "Mexico",
        BR: "Brazil",
        AR: "Argentina",
        CL: "Chile",
        CO: "Colombia",
        PE: "Peru",
        VE: "Venezuela",
        EC: "Ecuador",
        BO: "Bolivia",
        PY: "Paraguay",
        UY: "Uruguay",
        JP: "Japan",
        KR: "South Korea",
        CN: "China",
        IN: "India",
        SG: "Singapore",
        MY: "Malaysia",
        TH: "Thailand",
        VN: "Vietnam",
        ID: "Indonesia",
        PH: "Philippines",
        HK: "Hong Kong",
        TW: "Taiwan",
        IL: "Israel",
        PS: "Palestine",
        AE: "UAE",
        SA: "Saudi Arabia",
        QA: "Qatar",
        KW: "Kuwait",
        BH: "Bahrain",
        OM: "Oman",
        ZA: "South Africa",
        NG: "Nigeria",
        EG: "Egypt",
        MA: "Morocco",
        TN: "Tunisia",
        DZ: "Algeria",
        KE: "Kenya",
        GH: "Ghana",
        ET: "Ethiopia",
        TZ: "Tanzania",
        UG: "Uganda",
        RW: "Rwanda",
        SN: "Senegal",
        CI: "Cote d'Ivoire",
        CM: "Cameroon",
        AO: "Angola",
        MZ: "Mozambique",
        ZM: "Zambia",
        ZW: "Zimbabwe",
        BW: "Botswana",
        NA: "Namibia",
        MG: "Madagascar",
        MU: "Mauritius",
        SC: "Seychelles",
        KM: "Comoros",
        DJ: "Djibouti",
        ER: "Eritrea",
        SO: "Somalia",
        SD: "Sudan",
        SS: "South Sudan",
        TD: "Chad",
        NE: "Niger",
        ML: "Mali",
        BF: "Burkina Faso",
        BJ: "Benin",
        TG: "Togo",
        LR: "Liberia",
        GN: "Guinea",
        GM: "Gambia",
        GA: "Gabon",
        CG: "Congo",
        CD: "Democratic Republic of the Congo",
        CF: "Central African Republic",
        MW: "Malawi",
        MR: "Mauritania",
        LY: "Libya",
        LB: "Lebanon",
        JO: "Jordan",
        SY: "Syria",
        IQ: "Iraq",
        IR: "Iran",
        AF: "Afghanistan",
        PK: "Pakistan",
        BD: "Bangladesh",
        LK: "Sri Lanka",
        NP: "Nepal",
        LA: "Laos",
        KH: "Cambodia",
        BN: "Brunei",
        FJ: "Fiji",
        VU: "Vanuatu",
        WS: "Samoa",
        TO: "Tonga",
        KI: "Kiribati",
        TV: "Tuvalu",
        NR: "Nauru",
        GU: "Guam",
        AQ: "Antarctica",
        RU: "Russia",
        GE: "Georgia",
      };
      return countryMap[country.toUpperCase()] || country;
    }

    // Otherwise, it's already a full name
    return country;
  };

  const countryName = getCountryName(artistCountry?.country);

  return (
    <div className={`items-center text-gold flex ${className}`}>
      <CountryFlags countryName={countryName} size={size} />
      <FlexBox
        type="row-start"
        className={`secondary gap-1 pl-1 capitalize items-center *:leading-none ${
          size === "small" ? "text-[9px]" : "text-[9px] md:text-xs"
        }`}
      >
        {countryName && <p>{countryName}</p>}
        {hasValidCity && <Dot />}
        {hasValidCity && <p>{artistCountry.city}</p>}
      </FlexBox>
    </div>
  );
};

export default ArtistCountry;
