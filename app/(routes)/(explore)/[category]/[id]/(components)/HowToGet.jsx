"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  useLoadScript,
  GoogleMap,
  OverlayView,
  Marker,
} from "@react-google-maps/api";
import {
  FiNavigation,
  FiMapPin,
  FiClock,
  FiExternalLink,
} from "react-icons/fi";
import Button from "@/app/components/buttons/Button";
import SectionContainer from "@/app/components/containers/SectionContainer";
import {
  formatBirthdate,
  geocodeAddress,
  normalizeLineup,
} from "@/app/helpers/utils";
import ArtistCountry from "@/app/components/materials/ArtistCountry";

// Custom dark/gold map style to match the app theme
const MAP_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#1a1a1a" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a1a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#c8a84b" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d4a843" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#c8a84b" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#222c1f" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#2d2d2d" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#111111" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#3c3000" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1a1400" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2f3948" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0d1b2a" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }],
  },
];

const MAP_CONTAINER_STYLE = { width: "100%", height: "100%" };
const LIBRARIES = ["places"];

// ── Main component ──────────────────────────────────────────────────────────
const HowToGet = ({ data, type }) => {
  const address = data?.address;
  const locationUrl = data?.location_url;
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });
  const [venueCoords, setVenueCoords] = useState(null);
  const [userCoords, setUserCoords] = useState(null);
  const [distanceInfo, setDistanceInfo] = useState(null);
  const [geoError, setGeoError] = useState(null);
  const [loadingDistance, setLoadingDistance] = useState(false);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!isLoaded || !address) return;
    geocodeAddress(address)
      .then(setVenueCoords)
      .catch(() => setVenueCoords(null));
  }, [isLoaded, address]);

  const onMapLoad = useCallback(
    (map) => {
      mapRef.current = map;
      if (venueCoords) map.panTo(venueCoords);
      const hide = () => {
        map
          .getDiv()
          .querySelectorAll(".gm-style-cc, .gmnoprint a, .gm-style a")
          .forEach((el) => (el.style.display = "none"));
      };
      hide();
      window.google.maps.event.addListenerOnce(map, "tilesloaded", hide);
    },
    [venueCoords],
  );

  useEffect(() => {
    if (mapRef.current && venueCoords) mapRef.current.panTo(venueCoords);
  }, [venueCoords]);

  const handleGetDistance = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }
    setLoadingDistance(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(coords);
        try {
          const res = await fetch(
            `/api/distance?origin=${encodeURIComponent(`${coords.lat},${coords.lng}`)}&destination=${encodeURIComponent(address)}`,
          );
          if (res.ok) setDistanceInfo(await res.json());
        } catch {
          // silent
        } finally {
          setLoadingDistance(false);
        }
      },
      (err) => {
        setGeoError(err.message || "Could not get your location.");
        setLoadingDistance(false);
      },
    );
  };

  if (!address && !locationUrl) return null;

  return (
    <SectionContainer
      title="How to Get There"
      description="Venue location, directions and distance from your current position"
    >
      <div className="flex flex-col gap-3 w-[70%]">
        {/* Address & action row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          {address && (
            <div className="flex items-center gap-2 text-stone-300 secondary text-sm">
              <FiMapPin className="text-yellow-500 shrink-0" />
              <span>{address}</span>
            </div>
          )}
          <div className="flex gap-2 sm:ml-auto flex-wrap">
            {locationUrl && (
              <Button
                href={locationUrl}
                target="_blank"
                icon={<FiExternalLink size={13} />}
                text="Open in Map"
              />
            )}
            <button
              onClick={handleGetDistance}
              disabled={loadingDistance}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-yellow-600 text-black hover:bg-yellow-500 transition-colors rounded disabled:opacity-50"
            >
              <FiNavigation size={13} />
              {loadingDistance ? "Locating…" : "Get Distance"}
            </button>
          </div>
        </div>

        {/* Distance result */}
        {distanceInfo && (
          <div className="flex gap-6 mb-4 text-sm">
            <div className="flex items-center gap-2 text-stone-200">
              <FiNavigation className="text-yellow-500" />
              <span>
                <span className="text-yellow-400 font-bold">
                  {distanceInfo.distance}
                </span>{" "}
                away
              </span>
            </div>
            <div className="flex items-center gap-2 text-stone-200">
              <FiClock className="text-yellow-500" />
              <span>
                ~{" "}
                <span className="text-yellow-400 font-bold">
                  {distanceInfo.duration}
                </span>{" "}
                by car
              </span>
            </div>
          </div>
        )}

        {geoError && <p className="text-red-400 text-xs mb-3">{geoError}</p>}

        {/* Map container */}
        <div className="relative w-full h-150 rounded overflow-hidden border border-stone-700">
          {loadError && (
            <div className="w-full h-full flex items-center justify-center text-stone-500 text-sm">
              Map failed to load.
            </div>
          )}

          {!isLoaded && !loadError && (
            <div className="w-full h-full flex items-center justify-center bg-stone-900 text-stone-500 text-sm animate-pulse">
              Loading map…
            </div>
          )}

          {isLoaded && !loadError && (
            <>
              <GoogleMap
                mapContainerStyle={MAP_CONTAINER_STYLE}
                center={venueCoords || { lat: 48.8566, lng: 2.3522 }}
                zoom={venueCoords ? 15 : 4}
                onLoad={onMapLoad}
                options={{
                  styles: MAP_STYLES,
                  disableDefaultUI: true,
                  zoomControl: false,
                  fullscreenControl: false,
                  mapTypeControl: false,
                  streetViewControl: false,
                  rotateControl: false,
                  scaleControl: false,
                  clickableIcons: false,
                  gestureHandling: "greedy",
                }}
              >
                {venueCoords && (
                  <OverlayView
                    position={venueCoords}
                    mapPaneName="overlayMouseTarget"
                    getPixelPositionOffset={(w, h) => ({
                      x: -(w / 2),
                      y: -(h / 2),
                    })}
                  >
                    <LocationCard
                      image={data?.image}
                      name={data?.name}
                      venueName={type === "events" ? data?.venue_name : null}
                    />
                  </OverlayView>
                )}

                {userCoords && (
                  <Marker
                    position={userCoords}
                    title="Your location"
                    icon={{
                      path: window.google.maps.SymbolPath.CIRCLE,
                      scale: 8,
                      fillColor: "#3b82f6",
                      fillOpacity: 1,
                      strokeColor: "#fff",
                      strokeWeight: 2,
                    }}
                  />
                )}
              </GoogleMap>
              {/* Info overlay (left side gradient panel) */}
              <MapInfoOverlay data={data} type={type} />
            </>
          )}
        </div>
      </div>
    </SectionContainer>
  );
};

const MapInfoOverlay = ({ data, type }) => {
  if (!data) return null;

  const isEvent = type === "events";
  const isFestival = type === "festivals";
  const artists = normalizeLineup(data.lineup);
  const MAX_ARTISTS = 12;
  const displayArtists = artists.slice(0, MAX_ARTISTS);
  const remaining = artists.length - MAX_ARTISTS;

  const dateText = isEvent
    ? formatBirthdate(data.date)
    : isFestival
      ? [formatBirthdate(data.start_date), formatBirthdate(data.end_date)]
          .filter(Boolean)
          .join(" – ")
      : null;

  return (
    <div className="absolute bg-linear-to-r from-black/90 to-transparent inset-y-0 left-0 w-[25%] pointer-events-none z-10 flex flex-col justify-center gap-2 p-4">
      {/* Name */}
      <h4 className="text-yellow-400 font-bold text-sm line-clamp-2">
        {data.name}
      </h4>
      <div className="">
        {dateText && <p className="text-cream text-sm font-bold">{dateText}</p>}
        {isEvent && data.doors_open && (
          <p className="text-cream/80 text-[10px] font-light secondary">
            <span>Doors Open: </span>
            <b className="font-bold">{data.doors_open}</b>
          </p>
        )}
        {isEvent && data.promoter && (
          <p className="text-cream/80 text-[10px] font-light secondary">
            <span>Promoter: </span>
            <b className="font-bold">{data.promoter}</b>
          </p>
        )}
      </div>
      {/* Minimum age badge */}
      {data.minimum_age != null && (
        <span className="w-fit px-5 pt-0.5 font-bold border border-green-500 text-green-500 bg-green-900/80">
          {data.minimum_age}+
        </span>
      )}

      {/* Country / city */}
      {(data.country || data.city) && (
        <ArtistCountry
          artistCountry={data}
          showFlag={true}
          className="text-cream/80 text-xs"
        />
      )}

      {/* Lineup (events + festivals) */}
      {displayArtists.length > 0 && (
        <>
          <p className="text-cream text-[10px] uppercase tracking-wide mb-1">
            Lineup
          </p>
          <div className="grid grid-cols-3">
            <div className="flex flex-wrap gap-1">
              {displayArtists.map((artist, i) => (
                <span
                  key={i}
                  className="text-[10px] bg-stone-700/80 text-stone-300 px-1.5 py-0.5"
                >
                  {artist}
                </span>
              ))}
              {remaining > 0 && (
                <span className="text-[10px] text-yellow-600 px-1 py-0.5 italic">
                  +{remaining} more…
                </span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const LocationCard = ({ image, name, venueName }) => (
  <div
    className="relative flex items-center justify-center"
    style={{ width: 110, height: 110, pointerEvents: "none" }}
  >
    <div className="venue-ring-1 absolute w-14 h-14 rounded-full border-2 border-yellow-500/70" />
    <div className="venue-ring-2 absolute w-14 h-14 rounded-full border border-yellow-400/40" />
    {/* Card */}
    <div className="venue-pulse relative z-10 flex flex-col items-center gap-1">
      <div
        className="w-10 h-10 overflow-hidden border-2 border-yellow-500"
        style={{ boxShadow: "0 0 16px rgba(200,168,75,0.65)" }}
      >
        {image ? (
          <img src={image} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-stone-900 flex items-center justify-center text-yellow-500 font-bold text-sm">
            {name?.[0]?.toUpperCase()}
          </div>
        )}
      </div>
      <span className="bg-black/80 text-cream text-xs font-semibold px-1.5 py-0.5 rounded max-w-[96px] truncate leading-none whitespace-nowrap">
        {venueName || name}
      </span>
    </div>
  </div>
);

export default HowToGet;
