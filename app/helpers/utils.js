export const formatTime = (timestamp) => {
  const createdAt = new Date(timestamp);
  const now = new Date();
  const diffMs = now - createdAt;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  return createdAt.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const formatBirthdate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

export const toDateOnlyString = (value) => {
  if (!value) return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getTodayDateOnlyString = () => toDateOnlyString(new Date());

export const isOnOrAfterToday = (value) => {
  const dateOnly = toDateOnlyString(value);
  const todayDateOnly = getTodayDateOnlyString();

  if (!dateOnly || !todayDateOnly) return false;
  return dateOnly >= todayDateOnly;
};

export const capitalizeFirst = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const capitalizeTitle = (title) => {
  return title
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export const truncateString = (str, maxLength = 12) => {
  return str.length > maxLength ? str.slice(0, maxLength) + "..." : str;
};

export const truncateBio = (text, limit) => {
  if (text.length <= limit) return text;
  return text.slice(0, limit) + "...";
};

export const markdownToHtml = (text) => {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br>");
};

// Geocode an address string → { lat, lng } using the Google Maps JS API (browser-only)
export function geocodeAddress(address) {
  return new Promise((resolve, reject) => {
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address }, (results, status) => {
      if (status === "OK" && results[0]) {
        const { lat, lng } = results[0].geometry.location;
        resolve({ lat: lat(), lng: lng() });
      } else {
        reject(new Error(`Geocode failed: ${status}`));
      }
    });
  });
}

// Normalize artist lineup arrays (strings or objects) to plain name strings
export function normalizeLineup(lineup) {
  if (!Array.isArray(lineup)) return [];
  return lineup
    .map((a) =>
      typeof a === "object" && a !== null
        ? a.name || a.stage_name || ""
        : String(a),
    )
    .filter(Boolean);
}
