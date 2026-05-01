"use client";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "@/app/features/userSlice";
import { CountryFlags } from "./CountryFlags";
import { AnimatePresence, motion } from "framer-motion";
import { FiAlertCircle, FiMapPin, FiX } from "react-icons/fi";

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
    window.dispatchEvent(new CustomEvent("userLocationSet"));
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

// GPS-only resolve — triggers browser permission dialog
const resolveGPS = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("no geolocation"));
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          resolve(await reverseGeocode(coords.latitude, coords.longitude));
        } catch {
          reject(new Error("geocode failed"));
        }
      },
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });

const UserRegion = () => {
  const user = useSelector(selectUser);
  const [location, setLocation] = useState(null);
  const [detecting, setDetecting] = useState(false);
  // null | 'ask' | 'requesting' | 'system-off' | 'denied'
  const [promptState, setPromptState] = useState(null);

  useEffect(() => {
    const cached = readCache();
    if (cached) {
      setLocation(cached);
      return;
    }

    setDetecting(true);
    resolve().then(async (loc) => {
      setDetecting(false);
      if (loc) {
        writeCache(loc);
        setLocation(loc);
        return;
      }
      // Both geolocation and IP lookup failed — show a permission prompt
      if (navigator.permissions) {
        try {
          const perm = await navigator.permissions.query({
            name: "geolocation",
          });
          setPromptState(perm.state === "denied" ? "denied" : "ask");
        } catch {
          setPromptState("ask");
        }
      } else {
        setPromptState("ask");
      }
    });
  }, []);

  const handleAllowLocation = async () => {
    setPromptState("requesting");
    try {
      const loc = await resolveGPS();
      writeCache(loc);
      setLocation(loc);
      setPromptState(null);
    } catch (err) {
      // code 1 = PERMISSION_DENIED, code 2 = POSITION_UNAVAILABLE (system location off)
      if (err?.code === 2) {
        setPromptState("system-off");
      } else {
        setPromptState("denied");
      }
    }
  };

  return (
    <>
      {/* Location display */}
      {location && (
        <div className="flex items-center secondary gap-2 text-cream font-light">
          <CountryFlags countryName={location.country} />
          <div className="gap-1 flex text-xs pointer-events-none">
            <span>{location.country}</span>|<span>{location.city}</span>
          </div>
        </div>
      )}

      {/* Detecting spinner */}
      {!location && detecting && (
        <span className="text-xs text-stone-500 secondary animate-pulse">
          Detecting location…
        </span>
      )}

      {/* Permission prompt modal */}
      <AnimatePresence>
        {promptState && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed z-50 bottom-5 right-5 max-w-72 bg-black/70 border border-gold/30 rounded-md px-4 py-3 flex flex-col gap-2 backdrop-blur-sm"
          >
            <button
              onClick={() => setPromptState(null)}
              className="absolute top-1.5 right-1.5 text-cream/40 hover:text-cream transition-colors"
            >
              <FiX size={14} />
            </button>

            {(promptState === "ask" || promptState === "requesting") && (
              <>
                <div className="flex items-center gap-2">
                  <FiMapPin size={14} className="text-gold shrink-0" />
                  <p className="text-cream font-bold text-sm">Allow Location</p>
                </div>
                <p className="text-cream/70 text-xs secondary leading-relaxed">
                  Enable location to discover events and artists near you.
                </p>
                <button
                  onClick={handleAllowLocation}
                  disabled={promptState === "requesting"}
                  className="mt-1 border border-gold/50 bg-gold/10 hover:bg-gold/20 text-gold font-bold text-xs uppercase tracking-wider px-4 py-2 transition-colors disabled:opacity-50"
                >
                  {promptState === "requesting"
                    ? "Detecting…"
                    : "Allow Location"}
                </button>
              </>
            )}

            {promptState === "system-off" && (
              <>
                <div className="flex items-center gap-2">
                  <FiAlertCircle size={14} className="text-gold shrink-0" />
                  <p className="text-cream font-bold text-sm">Location Off</p>
                </div>
                <p className="text-cream/70 text-xs secondary leading-relaxed">
                  Device location is turned off. Enable it in your phone&apos;s
                  settings, then reload the page.
                </p>
              </>
            )}

            {promptState === "denied" && (
              <>
                <div className="flex items-center gap-2">
                  <FiAlertCircle size={14} className="text-gold shrink-0" />
                  <p className="text-cream font-bold text-sm">
                    Location Blocked
                  </p>
                </div>
                <p className="text-cream/70 text-xs secondary leading-relaxed">
                  Location access is blocked. Re-enable it in your
                  browser&apos;s site permissions, then reload.
                </p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default UserRegion;
