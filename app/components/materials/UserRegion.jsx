"use client";
import { useEffect, useState } from "react";
import { CountryFlags } from "./CountryFlags";

const UserRegion = () => {
  const [location, setLocation] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("userLocation");
    if (stored) {
      const parsed = JSON.parse(stored);
      const dayPassed = Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000;
      if (!dayPassed) {
        setLocation(parsed);
        return;
      }
    }

    const fetchLocation = async () => {
      try {
        const res = await fetch("https://ipwho.is/");
        const data = await res.json();

        const newLocation = {
          country: data.country,
          city: data.city,
          countryCode: data.country_code,
          timestamp: Date.now(),
        };

        localStorage.setItem("userLocation", JSON.stringify(newLocation));
        setLocation(newLocation);
      } catch (err) {
        console.error("Error fetching location:", err);
      }
    };

    fetchLocation();
  }, []);

  if (!location) return null;

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
