import { supabaseAdmin } from "@/app/lib/config/supabaseServer";

function parseTracklist(tracklistValue) {
  if (!tracklistValue) return [];

  if (Array.isArray(tracklistValue)) {
    return tracklistValue;
  }

  if (typeof tracklistValue === "string") {
    try {
      const parsed = JSON.parse(tracklistValue);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return null;
    }
  }

  return [];
}

async function uploadAlbumImage(artistId, albumImage) {
  if (!albumImage || albumImage.size === 0) {
    return { publicUrl: null };
  }

  const fileExt = albumImage.name?.split(".")?.pop() || "jpg";
  const fileName = `${artistId}_${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from("album_images")
    .upload(fileName, albumImage, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    return { error: uploadError };
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from("album_images").getPublicUrl(fileName);

  return { publicUrl };
}

export async function getAlbums(artistId, limit = null) {
  const { count, error: countError } = await supabaseAdmin
    .from("artist_albums")
    .select("*", { count: "exact", head: true })
    .eq("artist_id", artistId);

  if (countError) {
    return { error: countError };
  }

  let query = supabaseAdmin
    .from("artist_albums")
    .select("*")
    .eq("artist_id", artistId)
    .order("release_date", { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data: albums, error: albumsError } = await query;

  if (albumsError) {
    return { error: albumsError };
  }

  return {
    albums: albums || [],
    total: count || 0,
    hasMore: limit ? (count || 0) > limit : false,
  };
}

export async function createAlbum({
  artistId,
  name,
  releaseDate,
  description,
  tracklist,
  albumImage,
}) {
  const parsedTracklist = parseTracklist(tracklist);

  if (parsedTracklist === null) {
    return { invalidTracklist: true };
  }

  const { publicUrl, error: uploadError } = await uploadAlbumImage(
    artistId,
    albumImage,
  );

  if (uploadError) {
    return { uploadError };
  }

  const albumData = {
    artist_id: artistId,
    name,
    release_date: releaseDate,
    description,
    tracklist: parsedTracklist,
  };

  if (publicUrl) {
    albumData.album_image = publicUrl;
  }

  const { data: album, error } = await supabaseAdmin
    .from("artist_albums")
    .insert(albumData)
    .select()
    .single();

  return { album, error };
}

export async function updateAlbum({
  artistId,
  albumId,
  name,
  releaseDate,
  description,
  tracklist,
  albumImage,
}) {
  const parsedTracklist = parseTracklist(tracklist);

  if (parsedTracklist === null) {
    return { invalidTracklist: true };
  }

  const updateData = {
    name,
    release_date: releaseDate,
    description,
    tracklist: parsedTracklist,
  };

  if (albumImage && albumImage.size > 0) {
    const { publicUrl, error: uploadError } = await uploadAlbumImage(
      artistId,
      albumImage,
    );

    if (uploadError) {
      return { uploadError };
    }

    updateData.album_image = publicUrl;
  }

  const { data: album, error } = await supabaseAdmin
    .from("artist_albums")
    .update(updateData)
    .eq("id", albumId)
    .eq("artist_id", artistId)
    .select()
    .single();

  return { album, error };
}

export async function deleteAlbum({ artistId, albumId }) {
  const { data, error } = await supabaseAdmin
    .from("artist_albums")
    .delete()
    .eq("id", albumId)
    .eq("artist_id", artistId)
    .select("id")
    .single();

  return { data, error };
}
