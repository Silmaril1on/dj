import fs from "fs";
import path from "path";

/**
 * Converts an entity name to the expected image filename pattern.
 * Examples:
 * "SPACE MOTION" -> "space-motion"
 * "aly & fur" -> "aly&fur"
 * "John O'Callaghan" -> "john-o'callaghan"
 */
export function normalizeArtistName(name) {
  if (!name) return null;

  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-&-/g, "&") // Replace " & " with "&"
    .replace(/;/g, ""); // Remove semicolons if any
}

// Alias used by the generic helpers below
const normalizeName = normalizeArtistName;

/**
 * Generic image finder – looks in /public/<subdir>/ for a file matching either
 * of the supplied names (.webp, .png, .jpg, .jpeg).
 *
 * @param {string|null} primaryName   – e.g. artist real name or club name
 * @param {string|null} fallbackName  – e.g. stage_name (may be null)
 * @param {string}      subdir        – folder under /public, e.g. "artist-photos"
 */
export function findEntityImage(primaryName, fallbackName, subdir) {
  const publicPath = path.join(process.cwd(), "public", subdir);
  const namesToTry = [primaryName, fallbackName].filter(Boolean);
  const extensions = [".webp", ".png", ".jpg", ".jpeg"];

  for (const name of namesToTry) {
    const normalized = normalizeName(name);
    if (!normalized) continue;

    for (const ext of extensions) {
      const filename = `${normalized}${ext}`;
      const filePath = path.join(publicPath, filename);
      if (fs.existsSync(filePath)) {
        return { filename, filePath, extension: ext.substring(1) };
      }
    }
  }

  return null;
}

/**
 * Finds the matching image file for an artist in the public folder.
 * Checks for .webp, .png, .jpg, and .jpeg extensions.
 */
export function findArtistImage(artistName, stageName) {
  return findEntityImage(artistName, stageName, "artist-photos");
}

/**
 * Finds the matching image file for a club in /public/club-photos/.
 */
export function findClubImage(clubName) {
  return findEntityImage(clubName, null, "artist-photos");
}

/**
 * Finds the matching image file for a festival in /public/festival-photos/.
 */
export function findFestivalImage(festivalName) {
  return findEntityImage(festivalName, null, "artist-photos");
}

/**
 * Gets all available artist images from the public folder.
 */
export function getAvailableArtistImages() {
  const publicPath = path.join(process.cwd(), "public", "artist-photos");

  if (!fs.existsSync(publicPath)) {
    return [];
  }

  const files = fs.readdirSync(publicPath);
  return files.filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return [".webp", ".png", ".jpg", ".jpeg"].includes(ext);
  });
}

/**
 * Generic helper – returns all image files in /public/<subdir>/.
 */
export function getAvailableImages(subdir) {
  const publicPath = path.join(process.cwd(), subdir);

  if (!fs.existsSync(publicPath)) {
    return [];
  }

  const files = fs.readdirSync(publicPath);
  return files.filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return [".webp", ".png", ".jpg", ".jpeg"].includes(ext);
  });
}
