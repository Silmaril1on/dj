import fs from "fs";
import path from "path";

/**
 * Converts artist name to the expected image filename pattern
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

/**
 * Finds the matching image file for an artist in the public folder
 * Checks for .webp, .png, .jpg, and .jpeg extensions
 */
export function findArtistImage(artistName, stageName) {
  const publicPath = path.join(process.cwd(), "public", "artist-photos");

  // Try both name and stage_name
  const namesToTry = [artistName, stageName].filter(Boolean);
  const extensions = [".webp", ".png", ".jpg", ".jpeg"];

  for (const name of namesToTry) {
    const normalizedName = normalizeArtistName(name);
    if (!normalizedName) continue;

    for (const ext of extensions) {
      const filename = `${normalizedName}${ext}`;
      const filePath = path.join(publicPath, filename);

      if (fs.existsSync(filePath)) {
        return {
          filename,
          filePath,
          extension: ext.substring(1), // Remove the dot
        };
      }
    }
  }

  return null;
}

/**
 * Gets all available artist images from the public folder
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
