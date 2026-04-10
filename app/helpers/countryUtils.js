// Country code to full name mapping
const countryCodeToName = {
  US: "United States",
  GB: "United Kingdom",
  "GB-SCT": "Scotland",
  "GB-WLS": "Wales",
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
  BA: "Bosnia",
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
  AE: "United Arab Emirates",
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
  AD: "Andorra",
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
  MD: "Moldova",
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
  TR: "Turkey",
  TO: "Tonga",
  KI: "Kiribati",
  TV: "Tuvalu",
  NR: "Nauru",
  GU: "Guam",
  AQ: "Antarctica",
  RU: "Russia",
  GE: "Georgia",
  GEO: "Georgia",
};

// Create reverse mapping (lowercase name to full name)
const nameLookup = {};
Object.entries(countryCodeToName).forEach(([code, name]) => {
  nameLookup[name.toLowerCase()] = name;
  nameLookup[code.toLowerCase()] = name;
});

/**
 * Normalizes country names and codes to consistent full country names
 * @param {string} country - Country name or code (e.g., "BE", "belgium", "Belgium")
 * @returns {string} - Full country name (e.g., "Belgium")
 */
export const normalizeCountryName = (country) => {
  if (!country) return "";

  const countryStr = String(country).trim();
  const countryLower = countryStr.toLowerCase();

  // Check if it's in our lookup (handles both codes and names)
  if (nameLookup[countryLower]) {
    return nameLookup[countryLower];
  }

  // If not found, return original with proper capitalization
  return countryStr.charAt(0).toUpperCase() + countryStr.slice(1).toLowerCase();
};

/**
 * Normalize an array of items with country fields
 * @param {Array} items - Array of items with country property
 * @returns {Array} - Array with normalized country names
 */
export const normalizeCountriesInData = (items) => {
  if (!Array.isArray(items)) return items;

  return items.map((item) => ({
    ...item,
    country: normalizeCountryName(item.country),
  }));
};
