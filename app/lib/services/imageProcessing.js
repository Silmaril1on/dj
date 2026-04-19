import sharp from "sharp";

const RESIZED_VARIANTS = [
  { key: "sm", width: 250, quality: 75 },
  { key: "md", width: 500, quality: 85 },
];

export async function processAndUploadImage(
  source,
  adminClient,
  bucket,
  baseName,
) {
  let inputBuffer;
  let originalContentType = "image/jpeg";
  let originalExt = "jpg";

  if (source instanceof File) {
    inputBuffer = Buffer.from(await source.arrayBuffer());
    originalContentType = source.type || "image/jpeg";
    const nameParts = source.name?.split(".");
    if (nameParts?.length > 1) {
      originalExt = nameParts[nameParts.length - 1]
        .toLowerCase()
        .replace("jpeg", "jpg");
    }
  } else if (source instanceof ArrayBuffer) {
    inputBuffer = Buffer.from(source);
  } else {
    inputBuffer = source; // already a Buffer
  }

  const urls = {};

  // --- sm and md: resize + convert to JPEG ---
  for (const { key, width, quality } of RESIZED_VARIANTS) {
    const resized = await sharp(inputBuffer)
      .rotate() // honour EXIF orientation
      .resize(width, null, {
        withoutEnlargement: true,
        fit: "inside",
      })
      .jpeg({ quality, progressive: true })
      .toBuffer();

    const filePath = `${baseName}_${key}.jpg`;

    const { error: uploadError } = await adminClient.storage
      .from(bucket)
      .upload(filePath, resized, {
        contentType: "image/jpeg",
        cacheControl: "31536000", // 1 year — immutable once uploaded
        upsert: false,
      });

    if (uploadError) {
      throw new Error(
        `Failed to upload ${key} image variant: ${uploadError.message}`,
      );
    }

    const {
      data: { publicUrl },
    } = adminClient.storage.from(bucket).getPublicUrl(filePath);

    urls[key] = publicUrl;
  }

  // --- lg: upload original file unchanged ---
  const lgPath = `${baseName}_lg.${originalExt}`;
  const { error: lgUploadError } = await adminClient.storage
    .from(bucket)
    .upload(lgPath, inputBuffer, {
      contentType: originalContentType,
      cacheControl: "31536000",
      upsert: false,
    });

  if (lgUploadError) {
    throw new Error(
      `Failed to upload lg image variant: ${lgUploadError.message}`,
    );
  }

  const {
    data: { publicUrl: lgUrl },
  } = adminClient.storage.from(bucket).getPublicUrl(lgPath);

  urls.lg = lgUrl;

  return urls; // { sm: "https://...", md: "https://...", lg: "https://..." }
}

/**
 * Download a remote image URL, process it into sm/md/lg, and upload all
 * three variants. Useful for automated / bulk imports.
 *
 * @param {string} remoteUrl  - Publicly accessible image URL to download
 * @param {import('@supabase/supabase-js').SupabaseClient} adminClient
 * @param {string} bucket
 * @param {string} baseName
 * @returns {Promise<{sm: string, md: string, lg: string}>}
 */
export async function processAndUploadRemoteImage(
  remoteUrl,
  adminClient,
  bucket,
  baseName,
) {
  const response = await fetch(remoteUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to download image from ${remoteUrl}: ${response.status}`,
    );
  }
  const arrayBuffer = await response.arrayBuffer();
  return processAndUploadImage(arrayBuffer, adminClient, bucket, baseName);
}

/**
 * Delete all image size variants from storage.
 * Handles both legacy string-URL values and the new JSONB {sm, md, lg} objects.
 *
 * @param {string|{sm?:string,md?:string,lg?:string}|null} imageUrl
 * @param {import('@supabase/supabase-js').SupabaseClient} adminClient
 * @param {string} bucket
 */
export async function deleteImageVariants(imageUrl, adminClient, bucket) {
  if (!imageUrl) return;

  const paths = [];

  if (typeof imageUrl === "string") {
    const p = _extractPath(imageUrl, bucket);
    if (p) paths.push(p);
  } else if (typeof imageUrl === "object") {
    for (const url of Object.values(imageUrl)) {
      if (url) {
        const p = _extractPath(String(url), bucket);
        if (p) paths.push(p);
      }
    }
  }

  if (paths.length > 0) {
    await adminClient.storage.from(bucket).remove(paths);
  }
}

/** Extract the storage object path from a public URL. */
function _extractPath(url, bucket) {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  return idx !== -1 ? url.slice(idx + marker.length) : null;
}
