"use client";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "@/app/features/userSlice";
import { CountryFlags } from "./CountryFlags";

const CACHE_KEY = "userLocation";
const CACHE_TTL = 24 * 60 * 60 * 1000;

const readCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.country || Date.now() - parsed.timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const writeCache = (loc) => {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ ...loc, timestamp: Date.now() }),
    );
  } catch {}
};

// BigDataCloud: free, no API key, no CORS issues, precise reverse geocoding
const reverseGeocode = async (lat, lng) => {
  const res = await fetch(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
  );
  if (!res.ok) throw new Error("reverse geocode failed");
  const d = await res.json();
  const city = d.city || d.locality || d.principalSubdivision || null;
  const country = d.countryName || null;
  const countryCode = d.countryCode || null;
  if (!country) throw new Error("no country in response");
  return { country, city, countryCode, lat, lng };
};

// IP fallback — no permission needed
const fromIP = async () => {
  const res = await fetch("https://ipwho.is/");
  if (!res.ok) throw new Error("ip lookup failed");
  const d = await res.json();
  if (!d.success) throw new Error("ip lookup unsuccessful");
  return { country: d.country, city: d.city, countryCode: d.country_code };
};

const resolve = () =>
  new Promise((done) => {
    if (!navigator.geolocation) {
      fromIP()
        .then(done)
        .catch(() => done(null));
      return;
    }

    const timeout = setTimeout(() => {
      // geolocation timed out — fall back to IP
      fromIP()
        .then(done)
        .catch(() => done(null));
    }, 7000);

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        clearTimeout(timeout);
        try {
          done(await reverseGeocode(coords.latitude, coords.longitude));
        } catch {
          try {
            done(await fromIP());
          } catch {
            done(null);
          }
        }
      },
      async () => {
        clearTimeout(timeout);
        try {
          done(await fromIP());
        } catch {
          done(null);
        }
      },
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 0 },
    );
  });

const UserRegion = () => {
  const user = useSelector(selectUser);
  const [location, setLocation] = useState(null);
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    const cached = readCache();
    if (cached) {
      setLocation(cached);
      return;
    }

    setDetecting(true);
    resolve().then((loc) => {
      setDetecting(false);
      if (!loc) return;
      writeCache(loc);
      setLocation(loc);
    });
  }, []);

  if (!location) {
    return detecting ? (
      <span className="text-xs text-stone-500 secondary animate-pulse">
        Detecting location…
      </span>
    ) : null;
  }

  return (
    <div className="flex items-center secondary gap-2 text-cream font-light">
      <CountryFlags countryName={location.country} />
      <div className="gap-1 flex text-xs pointer-events-none">
        <span>{location.country}</span>|<span>{location.city}</span>
      </div>
    </div>
  );
};

export default UserRegion;
