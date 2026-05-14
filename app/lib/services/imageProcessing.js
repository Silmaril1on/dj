import sharp from "sharp";

const MAX_INPUT_BYTES = 15 * 1024 * 1024; // 15 MB hard limit
const ALLOWED_FORMATS = new Set([
  "jpeg",
  "png",
  "webp",
  "gif",
  "avif",
  "tiff",
  "heif",
]);
const FETCH_TIMEOUT_MS = 15_000;

/**
 * Width + quality targets for each named variant.
 * All variants are encoded as WebP for optimal compression.
 */
const IMAGE_VARIANTS = {
  sm: { width: 250, quality: 75 },
  md: { width: 600, quality: 80 },
  lg: { width: 1400, quality: 85 },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function toBuffer(source) {
  if (source instanceof File) return Buffer.from(await source.arrayBuffer());
  if (source instanceof ArrayBuffer) return Buffer.from(source);
  return source; // already a Buffer
}

async function uploadVariant(client, bucket, filePath, buffer) {
  const { error } = await client.storage.from(bucket).upload(filePath, buffer, {
    contentType: "image/webp",
    cacheControl: "31536000", // 1 year — filenames are content-addressed
    upsert: false,
  });
  if (error) throw new Error(`Upload failed for ${filePath}: ${error.message}`);
  const {
    data: { publicUrl },
  } = client.storage.from(bucket).getPublicUrl(filePath);
  return publicUrl;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Process an image source into WebP variants and upload them to storage.
 *
 * Drop-in replacement for the old 4-param version — the optional 5th param
 * lets callers restrict which variants are generated (e.g. maps only need
 * ["md", "lg"]).
 *
 * @param {File|ArrayBuffer|Buffer} source
 * @param {object} client  - Supabase client (admin or authenticated user)
 * @param {string} bucket  - Storage bucket name
 * @param {string} baseName - Path prefix, e.g. "artists/abc_123"
 * @param {{ variants?: Array<"sm"|"md"|"lg"> }} [options]
 * @returns {Promise<Record<string, string>>} e.g. { sm: "https://...", md, lg }
 */
export async function processAndUploadImage(
  source,
  client,
  bucket,
  baseName,
  { variants = ["sm", "md", "lg"] } = {},
) {
  const inputBuffer = await toBuffer(source);

  if (inputBuffer.length > MAX_INPUT_BYTES) {
    throw new Error(
      `Image exceeds the ${MAX_INPUT_BYTES / 1024 / 1024} MB limit`,
    );
  }

  // Detect real format via Sharp — do not trust the file extension
  const meta = await sharp(inputBuffer).metadata();
  if (!ALLOWED_FORMATS.has(meta.format)) {
    throw new Error(`Unsupported image format: ${meta.format ?? "unknown"}`);
  }

  const uploadedPaths = [];
  const urls = {};

  try {
    for (const key of variants) {
      const { width, quality } = IMAGE_VARIANTS[key];
      const processed = await sharp(inputBuffer)
        .rotate() // honour EXIF orientation
        .resize({ width, fit: "inside", withoutEnlargement: true })
        .webp({ quality, effort: 4 })
        .toBuffer();

      const filePath = `${baseName}_${key}.webp`;
      urls[key] = await uploadVariant(client, bucket, filePath, processed);
      uploadedPaths.push(filePath);
      console.log(
        `📐 [${key}] ${filePath} — ${(processed.length / 1024).toFixed(1)} KB`,
      );
    }
  } catch (err) {
    // Roll back any variants already uploaded before rethrowing
    if (uploadedPaths.length > 0) {
      await client.storage
        .from(bucket)
        .remove(uploadedPaths)
        .catch(() => {});
    }
    throw err;
  }

  return urls;
}

/**
 * Fetch a remote image and process it via processAndUploadImage.
 * Includes a 15-second timeout to avoid hanging on slow/dead URLs.
 */
export async function processAndUploadRemoteImage(
  remoteUrl,
  client,
  bucket,
  baseName,
  options,
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let arrayBuffer;
  try {
    const response = await fetch(remoteUrl, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(
        `Remote image fetch failed (${response.status}): ${remoteUrl}`,
      );
    }
    arrayBuffer = await response.arrayBuffer();
  } finally {
    clearTimeout(timer);
  }

  return processAndUploadImage(arrayBuffer, client, bucket, baseName, options);
}

/**
 * Backward-compatible wrapper for map images (md + lg only).
 * Keeps the old 4-param call signature so festival.js needs no changes.
 */
export async function processAndUploadMapImage(
  source,
  client,
  bucket,
  baseName,
) {
  return processAndUploadImage(source, client, bucket, baseName, {
    variants: ["md", "lg"],
  });
}

/**
 * Remove all storage objects referenced by an imageUrl.
 * Accepts both a plain string URL and a { sm, md, lg } object.
 */
export async function deleteImageVariants(imageUrl, client, bucket) {
  if (!imageUrl) return;

  const paths = [];
  const collect = (url) => {
    const p = _extractPath(String(url), bucket);
    if (p) paths.push(p);
  };

  if (typeof imageUrl === "string") {
    collect(imageUrl);
  } else if (typeof imageUrl === "object") {
    Object.values(imageUrl).forEach((url) => url && collect(url));
  }

  if (paths.length > 0) {
    await client.storage.from(bucket).remove(paths);
  }
}

/** Extract the storage object path from a Supabase public URL. */
function _extractPath(url, bucket) {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  return idx !== -1 ? url.slice(idx + marker.length) : null;
}
