/**
 * Parse latitude and longitude from a Google Maps URL.
 * Supports formats:
 *   https://www.google.com/maps?q=20.216644,-87.445929
 *   https://www.google.com/maps/place/.../@20.216644,-87.445929,...
 *
 * @param {string|null|undefined} locationUrl
 * @returns {{ lat: number, lng: number } | null}
 */
export function parseLatLng(locationUrl) {
  if (!locationUrl || typeof locationUrl !== "string") return null;

  // Format: ?q=lat,lng
  const qMatch = locationUrl.match(/[?&]q=([-\d.]+),([-\d.]+)/);
  if (qMatch) {
    const lat = parseFloat(qMatch[1]);
    const lng = parseFloat(qMatch[2]);
    if (isValidCoord(lat, lng)) return { lat, lng };
  }

  // Format: /@lat,lng,zoom or /@lat,lng
  const atMatch = locationUrl.match(/\/@([-\d.]+),([-\d.]+)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    if (isValidCoord(lat, lng)) return { lat, lng };
  }

  return null;
}

function isValidCoord(lat, lng) {
  return (
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}
