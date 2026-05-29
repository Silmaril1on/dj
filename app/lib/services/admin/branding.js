"use server";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";
import { ServiceError } from "@/app/lib/services/shared";

const POSTER_BUCKET = "profile_images";
const POSTER_FOLDER = "poster_image";

/** Returns the single branding config row. */
export async function getBranding() {
  const { data, error } = await supabaseAdmin
    .from("branding")
    .select("*")
    .limit(1)
    .single();

  if (error) throw new ServiceError(error.message, 500);
  return data;
}

/** Get the row id, creating the seed row when the table is empty. */
async function getOrCreateBrandingId() {
  const { data, error } = await supabaseAdmin
    .from("branding")
    .select("id")
    .limit(1)
    .single();

  if (!error && data) return data.id;

  // Row does not exist yet — insert the seed row
  const { data: inserted, error: insErr } = await supabaseAdmin
    .from("branding")
    .insert({ episode_number: 1, tracklist: [] })
    .select("id")
    .single();

  if (insErr) throw new ServiceError(insErr.message, 500);
  return inserted.id;
}

/** Update any subset of branding fields. */
export async function updateBranding(updates) {
  const id = await getOrCreateBrandingId();

  const { data, error } = await supabaseAdmin
    .from("branding")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new ServiceError(error.message, 500);
  return data;
}

/**
 * Upload poster image as-is (no compression) to profile_images/poster_image/.
 * Old images are NOT deleted — they accumulate as a history.
 */
export async function uploadPosterImage(file, brandingId) {
  const ext = file.name?.split(".").pop() || "jpg";
  const fileName = `poster_${Date.now()}.${ext}`;
  const storagePath = `${POSTER_FOLDER}/${fileName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabaseAdmin.storage
    .from(POSTER_BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });

  if (uploadError) throw new ServiceError(uploadError.message, 500);

  const { data: urlData } = supabaseAdmin.storage
    .from(POSTER_BUCKET)
    .getPublicUrl(storagePath);

  const publicUrl = urlData.publicUrl;

  const { data, error } = await supabaseAdmin
    .from("branding")
    .update({ poster_url: publicUrl })
    .eq("id", brandingId)
    .select()
    .single();

  if (error) throw new ServiceError(error.message, 500);
  return data;
}
