"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "@/app/features/userSlice";
import {
  useLoadScript,
  GoogleMap,
  OverlayView,
  DirectionsRenderer,
} from "@react-google-maps/api";
import {
  FiNavigation,
  FiMapPin,
  FiClock,
  FiExternalLink,
  FiRadio,
} from "react-icons/fi";
import { MdOutlineLocalParking, MdLocalHotel } from "react-icons/md";
import Button from "@/app/components/buttons/Button";
import SectionContainer from "@/app/components/containers/SectionContainer";
import {
  formatBirthdate,
  geocodeAddress,
  resolveImage,
} from "@/app/helpers/utils";
import ArtistCountry from "@/app/components/materials/ArtistCountry";
import Close from "@/app/components/buttons/Close";
import Motion from "@/app/components/containers/Motion";
import { AnimatePresence, motion } from "framer-motion";

// Custom dark/gold map style to match the app theme
const MAP_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#1a1a1a" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a1a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#c8a84b" }] },
  {
    featureType: "administrative.country",
    elementType: "geometry.stroke",
    stylers: [{ color: "#5e500c" }, { weight: 1.5 }],
  },
  {
    featureType: "administrative.country",
    elementType: "labels.text.fill",
    stylers: [{ color: "#fcb913" }],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#ccc3a6" }],
  },
  {
    featureType: "poi.business",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi.attraction",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "transit.station",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "transit",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#222c1f" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b8f5a" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#021d38" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }],
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
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }],
  },
  {
    featureType: "road",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi.sports_complex",
    stylers: [{ visibility: "on" }],
  },
  {
    featureType: "poi.attraction",
    elementType: "labels.text",
    stylers: [{ visibility: "on" }],
  },
  {
    featureType: "poi.place_of_worship",
    stylers: [{ visibility: "on" }],
  },
];

const MAP_CONTAINER_STYLE = { width: "100%", height: "100%" };
const LIBRARIES = ["places"];

const FRANKFURT = { lat: 50.1109, lng: 8.6821 };

const PRIMARY_ROUTE_OPTIONS = {
  suppressMarkers: true,
  polylineOptions: {
    strokeColor: "#fcb913",
    strokeWeight: 5,
    strokeOpacity: 0.85,
  },
};

const ALT_ROUTE_OPTIONS = {
  suppressMarkers: true,
  polylineOptions: {
    strokeColor: "#c8a84b",
    strokeWeight: 3,
    strokeOpacity: 0.35,
  },
};

// ── Map section (mounts only after user reveals it) ────────────────────────
const MapSection = ({ data, type }) => {
  const user = useSelector(selectUser);
  const address = data?.address;
  const locationUrl = data?.location_url;
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });
  const [venueCoords, setVenueCoords] = useState(null);
  const [userCoords, setUserCoords] = useState(null);
  const [distanceInfo, setDistanceInfo] = useState(null);
  const [directions, setDirections] = useState(null);
  const [geoError, setGeoError] = useState(null);
  const [loadingDistance, setLoadingDistance] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationInput, setLocationInput] = useState("");
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState({
    parking: [],
    lodging: [],
    transit: [],
  });
  const [loadingNearby, setLoadingNearby] = useState({
    parking: false,
    lodging: false,
    transit: false,
  });
  const [activeNearby, setActiveNearby] = useState(new Set());
  const mapRef = useRef(null);
  const fetchedCategoriesRef = useRef(new Set());

  useEffect(() => {
    if (!isLoaded || !address) return;
    geocodeAddress(address)
      .then(setVenueCoords)
      .catch(() => setVenueCoords(null));
  }, [isLoaded, address]);

  // Restore user pin position from localStorage — no auto-route
  useEffect(() => {
    if (!isLoaded || !venueCoords) return;
    try {
      const raw = localStorage.getItem("userLocation");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.lat && parsed?.lng)
          setUserCoords({ lat: parsed.lat, lng: parsed.lng });
      }
    } catch {
      // unavailable
    }
  }, [isLoaded, venueCoords]);

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

  const computeRoute = useCallback(
    (origin) => {
      if (!window.google || !address) return;
      const svc = new window.google.maps.DirectionsService();
      svc.route(
        {
          origin,
          destination: address,
          travelMode: window.google.maps.TravelMode.DRIVING,
          provideRouteAlternatives: true,
        },
        (result, status) => {
          if (status === "OK") {
            setDirections(result);
            const leg = result.routes[0]?.legs?.[0];
            if (leg) {
              setDistanceInfo({
                distance: leg.distance.text,
                duration: leg.duration.text,
              });
            }
            if (mapRef.current && result.routes[0]?.bounds) {
              mapRef.current.fitBounds(result.routes[0].bounds, {
                top: 80,
                right: 60,
                bottom: 80,
                left: 60,
              });
            }
          }
          setLoadingDistance(false);
        },
      );
    },
    [address],
  );

  const fetchDistanceAndRoute = useCallback(
    (coords) => {
      setLoadingDistance(true);
      setGeoError(null);
      setDistanceInfo(null);
      setDirections(null);
      computeRoute(coords);
    },
    [computeRoute],
  );

  const handleGetDistance = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }
    setLoadingDistance(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const userLocation = { lat: coords.latitude, lng: coords.longitude };
        setUserCoords(userLocation);
        fetchDistanceAndRoute(userLocation);
      },
      () => {
        setLoadingDistance(false);
        setGeoError(
          "Unable to retrieve your location. Please allow location access.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleCalculate = async () => {
    if (!locationInput.trim()) return;
    setLoadingLocation(true);
    try {
      const coords = await geocodeAddress(locationInput);
      setUserCoords(coords);
      setShowLocationModal(false);
      setLocationInput("");
      await fetchDistanceAndRoute(coords);
    } catch {
      // silent
    } finally {
      setLoadingLocation(false);
    }
  };

  const fetchNearby = useCallback(
    (category) => {
      if (!venueCoords || !mapRef.current || !window.google) return;

      // Toggle off
      if (activeNearby.has(category)) {
        setActiveNearby((prev) => {
          const next = new Set(prev);
          next.delete(category);
          return next;
        });
        return;
      }

      // Already fetched — just show
      if (fetchedCategoriesRef.current.has(category)) {
        setActiveNearby((prev) => new Set([...prev, category]));
        return;
      }

      // Fetch from Places API
      const TYPE_MAP = {
        parking: "parking",
        lodging: "lodging",
        transit: "transit_station",
      };
      setLoadingNearby((prev) => ({ ...prev, [category]: true }));
      const svc = new window.google.maps.places.PlacesService(mapRef.current);
      svc.nearbySearch(
        { location: venueCoords, radius: 5000, type: TYPE_MAP[category] },
        (results, status) => {
          setLoadingNearby((prev) => ({ ...prev, [category]: false }));
          if (
            status === window.google.maps.places.PlacesServiceStatus.OK &&
            results
          ) {
            fetchedCategoriesRef.current.add(category);
            setNearbyPlaces((prev) => ({
              ...prev,
              [category]: results.slice(0, 20),
            }));
            setActiveNearby((prev) => new Set([...prev, category]));
          }
        },
      );
    },
    [venueCoords, activeNearby],
  );

  return (
    <div className="flex flex-col gap-3 w-full lg:w-[70%]">
      {geoError && <p className="text-red-400 text-xs mb-3">{geoError}</p>}

      {/* Map container */}
      <div className="relative w-full h-120 lg:h-150 overflow-hidden  border border-cream/30">
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
              {/* Route polylines — primary + alternatives */}
              {directions &&
                directions.routes.map((_, i) => (
                  <DirectionsRenderer
                    key={i}
                    directions={directions}
                    routeIndex={i}
                    options={
                      i === 0 ? PRIMARY_ROUTE_OPTIONS : ALT_ROUTE_OPTIONS
                    }
                  />
                ))}

              {/* Bottom action bar */}
              <div className="absolute top-1 -right-7 lg:bottom-3 lg:right-3 z-10 flex items-end justify-end">
                <div className="flex gap-2 overflow-hidden scale-75 lg:scale-100">
                  <Motion animation="top" delay={0.2}>
                    <Button
                      onClick={() => setShowLocationModal(true)}
                      size="small"
                      icon={<FiMapPin size={13} />}
                      text="Change Location"
                      className="backdrop-blur-md"
                    />
                  </Motion>
                  {locationUrl && (
                    <Motion animation="top" delay={0.4}>
                      <Button
                        href={locationUrl}
                        target="_blank"
                        size="small"
                        icon={<FiExternalLink size={13} />}
                        text="Open in Map"
                        className="backdrop-blur-md"
                      />
                    </Motion>
                  )}
                  <Motion animation="top" delay={0.6}>
                    <Button
                      onClick={handleGetDistance}
                      size="small"
                      disabled={loadingDistance}
                      icon={<FiNavigation size={13} />}
                      text={loadingDistance ? "Locating…" : "Get Distance"}
                      className="backdrop-blur-md"
                    />
                  </Motion>
                </div>
              </div>

              {/* Distance result */}
              {distanceInfo && (
                <div className="flex gap-3 text-sm absolute bottom-12 right-3 z-10">
                  <div className="flex items-center gap-1 text-stone-200">
                    <FiNavigation className="text-yellow-500" />
                    <span>
                      <span className="text-yellow-400 font-bold">
                        {distanceInfo.distance}
                      </span>{" "}
                      away
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-stone-200">
                    <FiClock size={13} className="text-yellow-500" />
                    <span>
                      <span className="text-yellow-400 font-bold">
                        {distanceInfo.duration}
                      </span>{" "}
                      by car
                    </span>
                  </div>
                </div>
              )}

              {/* Nearby category toggles */}
              <div className="absolute overflow-hidden right-3 bottom-3 lg:bottom-20 z-10 flex flex-col items-end gap-1">
                {[
                  {
                    key: "parking",
                    label: "Parkings",
                    Icon: MdOutlineLocalParking,
                    delay: 0.8,
                  },
                  {
                    key: "lodging",
                    label: "Hotels",
                    Icon: MdLocalHotel,
                    delay: 1,
                  },
                  {
                    key: "transit",
                    label: "Stations",
                    Icon: FiRadio,
                    delay: 1.2,
                  },
                ].map(({ key, label, Icon, delay }) => {
                  const isActive = activeNearby.has(key);
                  const isLoading = loadingNearby[key];
                  return (
                    <Motion key={key} animation="fade" delay={delay}>
                      <button
                        onClick={() => fetchNearby(key)}
                        disabled={isLoading || !venueCoords}
                        title={`${isActive ? "Hide" : "Show"} ${label}`}
                        className={`w-9 h-9 flex items-center justify-center rounded-full cursor-pointer backdrop-blur-xs border transition-colors ${
                          isActive
                            ? "bg-gold border-gold text-black"
                            : "bg-gold/20 border-gold/30 text-gold hover:bg-gold/40"
                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                      >
                        <Icon size={15} />
                      </button>
                    </Motion>
                  );
                })}
              </div>

              {/* Nearby radius notice */}
              {activeNearby.size > 0 && (
                <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-0.5">
                  {[...activeNearby].map((category) => {
                    const labels = {
                      parking: "parking spots",
                      lodging: "hotels",
                      transit: "transit stations",
                    };
                    const count = nearbyPlaces[category]?.length ?? 0;
                    return (
                      <p
                        key={category}
                        className="bg-black/70 secondary backdrop-blur-sm text-cream/80 text-[10px] px-2 py-1 rounded leading-none"
                      >
                        Showing{" "}
                        <span className="text-gold font-semibold">
                          {count} {labels[category]}
                        </span>{" "}
                        within a 5 km radius of this venue
                      </p>
                    );
                  })}
                </div>
              )}

              {/* Nearby place pins */}
              {Object.entries(nearbyPlaces).map(([category, places]) =>
                activeNearby.has(category)
                  ? places.map((place, i) => (
                      <OverlayView
                        key={`${category}-${i}`}
                        position={place.geometry.location}
                        mapPaneName="overlayMouseTarget"
                        getPixelPositionOffset={() => ({ x: -32, y: -32 })}
                      >
                        <Motion animation="fade" delay={i * 0.1}>
                          <NearbyPin category={category} name={place.name} />
                        </Motion>
                      </OverlayView>
                    ))
                  : null,
              )}

              {venueCoords && (
                <OverlayView
                  position={venueCoords}
                  mapPaneName="overlayMouseTarget"
                  getPixelPositionOffset={() => ({ x: -55, y: -55 })}
                >
                  <LocationPin
                    type="venue"
                    image={resolveImage(data?.image, "sm")}
                    name={data?.name}
                    venueName={type === "events" ? data?.venue_name : null}
                  />
                </OverlayView>
              )}

              {userCoords && (
                <OverlayView
                  position={userCoords}
                  mapPaneName="overlayMouseTarget"
                  getPixelPositionOffset={() => ({ x: -45, y: -45 })}
                >
                  <LocationPin
                    type="user"
                    image={user?.user_avatar}
                    name={user?.userName}
                  />
                </OverlayView>
              )}

              {/* Location override modal */}
              {showLocationModal && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                  <div className="bg-stone-950 border border-cream/20 p-3 w-72 flex flex-col gap-3">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-cream font-bold text-sm tracking-wide">
                        Change Origin
                      </h3>
                      <Close onClick={() => setShowLocationModal(false)} />
                    </div>
                    <input
                      type="text"
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCalculate()}
                      placeholder="e.g. Berlin, Freiburg…"
                      autoFocus
                    />
                    <Button
                      onClick={handleCalculate}
                      size="small"
                      className="w-fit"
                      disabled={loadingLocation || !locationInput.trim()}
                      icon={<FiNavigation size={13} />}
                      text={loadingLocation ? "Calculating…" : "Calculate"}
                    />
                  </div>
                </div>
              )}
            </GoogleMap>
            {/* Info overlay (bottom gradient panel) */}
            <MapInfoOverlay data={data} type={type} />
          </>
        )}
      </div>
    </div>
  );
};

// ── Public wrapper — shows a reveal button, then lazily mounts MapSection ───
const HowToGet = ({ data, type }) => {
  const [mapRevealed, setMapRevealed] = useState(false);
  const address = data?.address;
  const locationUrl = data?.location_url;

  if (!address && !locationUrl) return null;

  return (
    <SectionContainer
      title="How to Get There"
      description="Venue location, directions and distance from your current position"
    >
      <AnimatePresence mode="wait">
        {!mapRevealed ? (
          <motion.div
            key="reveal-btn"
            initial={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.25, ease: "easeIn" }}
            className="w-full lg:w-[70%] h-44 flex items-center justify-start pl-2 lg:pl-4"
          >
            <button
              onClick={() => setMapRevealed(true)}
              className="group relative overflow-hidden border border-gold/50 bg-black/40 hover:bg-gold/10 transition-all duration-300 flex items-center gap-3 uppercase tracking-widest text-gold font-bold text-sm px-8 py-5"
            >
              <FiMapPin
                size={18}
                className="shrink-0 group-hover:scale-110 transition-transform duration-300"
              />
              <span>How to Get There</span>
              {/* shimmer sweep */}
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-gold/10 to-transparent transition-transform duration-700 ease-in-out pointer-events-none" />
            </button>
          </motion.div>
        ) : (
          <motion.div
            className="w-full center"
            key="map-content"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <MapSection data={data} type={type} />
          </motion.div>
        )}
      </AnimatePresence>
    </SectionContainer>
  );
};

const MapInfoOverlay = ({ data, type }) => {
  if (!data) return null;

  const isEvent = type === "events";
  const isFestival = type === "festivals";

  const dateText = isEvent
    ? formatBirthdate(data.date)
    : isFestival
      ? [formatBirthdate(data.start_date), formatBirthdate(data.end_date)]
          .filter(Boolean)
          .join(" – ")
      : null;

  return (
    <div className="absolute bg-linear-to-t from-black from-20% to-transparent left-0 bottom-0 w-full h-[20%] pointer-events-none z-5 flex justify-between items-end gap-2 pb-2 px-3">
      <div className="*:leading-none">
        <h4 className="font-bold uppercase text-xs lg:text-xl pr-5 lg:pr-0">
          {data.name}
        </h4>
        {(data.country || data.city) && (
          <ArtistCountry
            artistCountry={data}
            showFlag={true}
            className="text-cream/80 text-xs"
          />
        )}
        <div className="">
          <div className="flex items-center space-x-3 *:text-[10px] secondary">
            {dateText && (
              <p className="text-cream lg:text-sm font-bold ">{dateText}</p>
            )}
            {isEvent && data.doors_open && (
              <p className="text-cream/80  font-light  mb-0.5">
                <span>Doors Open: </span>
                <b className="font-bold">{data.doors_open}</b>
              </p>
            )}
            {isEvent && data.promoter && (
              <p className="text-cream/80  font-light ">
                <span>Promoter: </span>
                <b className="font-bold capitalize">{data.promoter}</b>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const LocationPin = ({ type = "venue", image, name, venueName }) => {
  const isUser = type === "user";
  const color = isUser ? "green" : "yellow";
  const size = isUser
    ? { outer: 90, ring: "w-12 h-12", img: "w-9 h-9" }
    : { outer: 110, ring: "w-14 h-14", img: "w-10 h-10" };
  const ringBorder = isUser
    ? {
        strong: "border-green-500/70",
        soft: "border-green-400/40",
        img: "border-green-500",
      }
    : {
        strong: "border-yellow-500/70",
        soft: "border-yellow-400/40",
        img: "border-yellow-500",
      };
  const glow = isUser
    ? "0 0 14px rgba(34,197,94,0.6)"
    : "0 0 16px rgba(200,168,75,0.65)";
  const fallbackText = isUser ? "text-green-400" : "text-yellow-500";
  const pulse = isUser ? "user-pulse" : "venue-pulse";
  const ring1 = isUser ? "user-ring-1" : "venue-ring-1";
  const ring2 = isUser ? "user-ring-2" : "venue-ring-2";
  const label = isUser ? (name ?? "You") : venueName || name;
  const fallback = isUser
    ? (name?.[0]?.toUpperCase() ?? "?")
    : name?.[0]?.toUpperCase();
  const rounded = isUser ? "rounded-full" : "";

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size.outer, height: size.outer, pointerEvents: "none" }}
    >
      <div
        className={`${ring1} absolute ${size.ring} rounded-full border-2 ${ringBorder.strong}`}
      />
      <div
        className={`${ring2} absolute ${size.ring} rounded-full border ${ringBorder.soft}`}
      />
      <div
        className={`${pulse} relative z-10 flex flex-col items-center gap-1`}
      >
        <div
          className={`${size.img} ${rounded} overflow-hidden border-2 ${ringBorder.img}`}
          style={{ boxShadow: glow }}
        >
          {image ? (
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className={`w-full h-full bg-stone-900 flex items-center justify-center ${fallbackText} font-bold text-sm`}
            >
              {fallback}
            </div>
          )}
        </div>
        <span className="bg-black/80 text-cream text-xs font-semibold px-1.5 py-0.5 rounded max-w-[96px] truncate leading-none whitespace-nowrap">
          {label}
        </span>
      </div>
    </div>
  );
};

const NEARBY_PIN_CONFIG = {
  parking: {
    letter: "P",
    colors:
      "border-blue-500/70 bg-blue-500/30 text-blue-400 shadow-blue-500/60",
  },
  lodging: {
    letter: "H",
    colors:
      "border-purple-500/70 bg-purple-500/20 text-purple-400 shadow-purple-500/60",
  },
  transit: {
    letter: "T",
    colors:
      "border-orange-500/70 bg-orange-500/20 text-orange-400 shadow-orange-500/60",
  },
};

const NearbyPin = ({ category, name }) => {
  const cfg = NEARBY_PIN_CONFIG[category];
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: 64, height: 64, pointerEvents: "none" }}
    >
      <div className="relative z-10 flex flex-col items-center gap-0.5">
        <div
          className={`w-6 h-6 rounded-full flex items-center backdrop-blur-lg justify-center border-2 font-bold text-[10px] shadow-md ${cfg.colors}`}
        >
          {cfg.letter}
        </div>
        <span className="bg-black/80 text-cream text-[9px] font-semibold px-1 py-0.5 rounded max-w-[70px] truncate leading-none whitespace-nowrap">
          {name}
        </span>
      </div>
    </div>
  );
};

export default HowToGet;
