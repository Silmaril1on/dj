/**
 * Calls Google Distance Matrix API (server-side) to get distance + duration
 * between an origin (user coords) and a destination (address string or coords).
 *
 * @param {string} origin      - "lat,lng"
 * @param {string} destination - address string or "lat,lng"
 * @returns {{ distance: string, duration: string } | null}
 */
export async function getDistanceToVenue(origin, destination) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey || !origin || !destination) return null;

  const url = new URL(
    "https://maps.googleapis.com/maps/api/distancematrix/json",
  );
  url.searchParams.set("origins", origin);
  url.searchParams.set("destinations", destination);
  url.searchParams.set("units", "metric");
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString(), { next: { revalidate: 300 } });
  if (!res.ok) return null;

  const json = await res.json();
  const element = json?.rows?.[0]?.elements?.[0];
  if (!element || element.status !== "OK") return null;

  return {
    distance: element.distance.text,
    duration: element.duration.text,
  };
}
