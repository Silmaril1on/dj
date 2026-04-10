"use server";
import { revalidateTag, unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";
import { getArtistLikesCount } from "@/app/lib/services/artists/artistLikes";
import { getArtistScheduleCount } from "@/app/lib/services/artists/artistSchedule";
import { getArtistUserData } from "@/app/lib/services/artists/getArtistUserData";
import {
  ServiceError,
  parseArrayField,
  validateImageFile,
  extractPublicObjectPath,
  sanitizeFileExtension,
  getAuthenticatedContext,
  getSupabaseServerClient,
  getSupabaseAdminClient,
} from "@/app/lib/services/shared";

export async function getArtistProfile(slug) {
  return unstable_cache(
    async () => {
      const { data, error } = await supabaseAdmin
        .from("artists")
        .select("*")
        .eq("artist_slug", slug)
        .single();

      if (error) throw new Error(error.message);
      if (!data) throw new Error("Artist not found");

      return data;
    },
    ["artist-profile", slug],
    { revalidate: 1800, tags: ["artists", `artist-profile-${slug}`] },
  )();
}

export async function getArtistById(id, cookieStore) {
  if (!id) throw new ServiceError("Artist ID is required", 400);
  const supabase = await getSupabaseServerClient(cookieStore);
  const { data, error } = await supabase
    .from("artists")
    .select(
      "id, name, stage_name, artist_slug, country, city, sex, is_band, birth, desc, bio, genres, social_links, label, artist_image, status, created_at, updated_at, user_id",
    )
    .eq("id", id)
    .single();

  if (error || !data) throw new ServiceError("Artist not found", 404);
  return data;
}

export async function getArtisForHomePage(cookieStore, userId = null) {
  const supabase = await getSupabaseServerClient(cookieStore);

  const { data: artists, error: artistsError } = await supabase
    .rpc("get_random_artists", { limit_count: 18 })
    .select(
      "id, name, stage_name, artist_image, artist_slug, country, city, rating_stats",
    )
    .eq("status", "approved");

  if (artistsError) {
    throw new ServiceError(artistsError.message, 500);
  }

  if (!artists || artists.length === 0) {
    return [];
  }

  const artistIds = artists.map((artist) => artist.id);

  const likesPromise = supabase
    .from("artist_likes")
    .select("artist_id, user_id")
    .in("artist_id", artistIds);

  const ratingsPromise = userId
    ? supabaseAdmin
        .from("artist_ratings")
        .select("artist_id, score")
        .eq("user_id", userId)
        .in("artist_id", artistIds)
    : Promise.resolve({ data: [], error: null });

  const [likesResult, ratingsResult] = await Promise.all([
    likesPromise,
    ratingsPromise,
  ]);

  if (likesResult.error) {
    throw new ServiceError(likesResult.error.message, 500);
  }

  if (ratingsResult.error) {
    throw new ServiceError(ratingsResult.error.message, 500);
  }

  const likesCount = {};
  const userLikes = {};
  likesResult.data?.forEach((like) => {
    likesCount[like.artist_id] = (likesCount[like.artist_id] || 0) + 1;
    if (userId && like.user_id === userId) {
      userLikes[like.artist_id] = true;
    }
  });

  const userRatings = {};
  ratingsResult.data?.forEach((rating) => {
    userRatings[rating.artist_id] = rating.score;
  });

  return artists.map((artist) => ({
    ...artist,
    likesCount: likesCount[artist.id] || 0,
    isLiked: userId ? !!userLikes[artist.id] : false,
    userRating: userId ? userRatings[artist.id] || null : null,
  }));
}

export async function createArtist(formData, cookieStore) {
  const { user, supabase } = await getAuthenticatedContext(cookieStore);
  const admin = getSupabaseAdminClient();

  const name = formData.get("name");
  const artistImage = formData.get("artist_image");
  const stage_name = formData.get("stage_name");
  const artist_slug = formData.get("artist_slug");
  const sex = formData.get("sex");
  const is_band = formData.get("is_band");
  const desc = formData.get("desc");
  const country = formData.get("country");
  const city = formData.get("city");
  const bio = formData.get("bio");
  const birth = formData.get("birth");

  if (!name || !artistImage || !desc || !country || !artist_slug) {
    throw new ServiceError(
      "Missing required fields: name, artist_image, desc, country, artist_slug",
      400,
    );
  }

  validateImageFile({
    file: artistImage,
    maxSize: 1 * 1024 * 1024,
    requiredMessage: "Artist image is required",
  });

  const genres = parseArrayField(formData, "genres");
  const social_links = parseArrayField(formData, "social_links");
  const label = parseArrayField(formData, "label");

  const randomId = Math.random().toString(36).substring(2, 15);
  const fileExtension = sanitizeFileExtension(artistImage.name);
  const fileName = `artist_${Date.now()}_${randomId}.${fileExtension}`;

  const { error: uploadError } = await admin.storage
    .from("artist_profile_images")
    .upload(fileName, artistImage, { cacheControl: "3600", upsert: false });

  if (uploadError) throw new ServiceError("Failed to upload image", 500);

  const {
    data: { publicUrl },
  } = admin.storage.from("artist_profile_images").getPublicUrl(fileName);

  const artistData = {
    name,
    artist_image: publicUrl,
    stage_name: stage_name || null,
    artist_slug: String(artist_slug).trim().toLowerCase(),
    sex: sex || null,
    is_band: is_band === "true",
    desc,
    country,
    city: city || null,
    label,
    bio: bio || null,
    birth: is_band === "true" ? null : birth || null,
    genres,
    social_links,
    status: "pending",
    user_id: user.id,
  };

  const { data: newArtist, error: insertError } = await admin
    .from("artists")
    .insert([artistData])
    .select()
    .single();

  if (insertError) {
    throw new ServiceError(
      `Failed to create artist: ${insertError.message}`,
      500,
    );
  }

  if (!user.is_admin) {
    await supabase
      .from("users")
      .update({ submitted_artist_id: newArtist.id })
      .eq("id", user.id);
  }

  try {
    await admin.from("notifications").insert({
      user_id: user.id,
      title: "Your DJ Profile Has Been Submitted",
      message: `Thank you for submitting your DJ profile "${stage_name || name}". Our team will review your submission and notify you once it's approved. You can view and edit your submission in your profile dashboard.`,
      type: "submit",
      read: false,
      created_at: new Date().toISOString(),
    });
  } catch {
    // Do not fail submission if notification insert fails.
  }

  revalidateTag("artists");
  revalidateTag(`user-statistics-${user.id}`);
  revalidateTag(`user-statistics-submitted-artist-${user.id}`);
  revalidateTag("user-statistics-submitted-artist");

  return {
    success: true,
    message: "Artist submitted successfully and is pending approval",
    data: newArtist,
  };
}

export async function updateArtist(formData, cookieStore) {
  const { user, supabase } = await getAuthenticatedContext(cookieStore);
  const admin = getSupabaseAdminClient();
  const artistIdRaw = formData.get("artistId");
  const artistId = artistIdRaw ? String(artistIdRaw).trim() : "";

  if (!artistId) throw new ServiceError("Artist ID is required", 400);

  const { data: profile } = await supabase
    .from("users")
    .select("submitted_artist_id, is_admin")
    .eq("id", user.id)
    .single();

  const submittedArtistId = profile?.submitted_artist_id
    ? String(profile.submitted_artist_id).trim()
    : null;
  const isAdmin = Boolean(profile?.is_admin);

  if (!isAdmin && (!submittedArtistId || submittedArtistId !== artistId)) {
    throw new ServiceError(
      "You can only update your own submitted artist",
      403,
    );
  }

  const { data: existingArtist, error: existingError } = await supabase
    .from("artists")
    .select("artist_image")
    .eq("id", artistId)
    .single();

  if (existingError || !existingArtist)
    throw new ServiceError("Artist not found", 404);

  const updateFields = {
    name: formData.get("name"),
    stage_name: formData.get("stage_name"),
    artist_slug: formData.get("artist_slug")
      ? String(formData.get("artist_slug")).trim().toLowerCase()
      : undefined,
    country: formData.get("country"),
    city: formData.get("city"),
    sex: formData.get("sex"),
    desc: formData.get("desc"),
    bio: formData.get("bio"),
    birth: formData.get("birth"),
    genres: parseArrayField(formData, "genres"),
    social_links: parseArrayField(formData, "social_links"),
    label: parseArrayField(formData, "label"),
  };

  const isBandValue = formData.get("is_band");
  if (isBandValue !== null) {
    updateFields.is_band = isBandValue === "true";
    if (updateFields.is_band) updateFields.birth = null;
  }

  const artistImage = formData.get("artist_image");
  if (artistImage instanceof File && artistImage.size > 0) {
    validateImageFile({
      file: artistImage,
      maxSize: 1 * 1024 * 1024,
      required: false,
    });

    const oldImagePath = extractPublicObjectPath(
      existingArtist.artist_image,
      "artist_profile_images",
    );
    if (oldImagePath) {
      await admin.storage.from("artist_profile_images").remove([oldImagePath]);
    }

    const randomId = Math.random().toString(36).substring(2, 15);
    const fileExtension = sanitizeFileExtension(artistImage.name);
    const fileName = `artist_${Date.now()}_${randomId}.${fileExtension}`;

    const { error: uploadError } = await admin.storage
      .from("artist_profile_images")
      .upload(fileName, artistImage, { cacheControl: "3600", upsert: false });

    if (uploadError) throw new ServiceError("Failed to upload image", 500);

    const {
      data: { publicUrl },
    } = admin.storage.from("artist_profile_images").getPublicUrl(fileName);

    updateFields.artist_image = publicUrl;
  }

  Object.keys(updateFields).forEach((key) => {
    if (updateFields[key] === null || updateFields[key] === undefined)
      delete updateFields[key];
  });
  updateFields.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("artists")
    .update(updateFields)
    .eq("id", artistId)
    .select()
    .single();

  if (error) throw new ServiceError("Failed to update artist", 500);

  return { success: true, message: "Artist updated successfully", data };
}

export async function getArtistProfilePayload({
  slug,
  artistId,
  userId,
  cookieStore,
}) {
  const artist = slug
    ? await getArtistProfile(slug)
    : await getArtistById(artistId, cookieStore);

  const [likesCount, scheduleCount, userSpecificData] = await Promise.all([
    getArtistLikesCount(artist.id),
    getArtistScheduleCount(artist.id),
    userId ? getArtistUserData(artist.id, userId) : Promise.resolve(null),
  ]);

  return {
    ...artist,
    likesCount,
    scheduleCount,
    isLiked: userSpecificData?.isLiked ?? false,
    userRating: userSpecificData?.userRating ?? null,
  };
}
