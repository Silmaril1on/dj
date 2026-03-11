import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createSupabaseServerClient,
  supabaseAdmin,
} from "@/app/lib/config/supabaseServer";

const extractArtistImagePath = (url) => {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const marker = "/storage/v1/object/public/artist_profile_images/";
    const idx = parsed.pathname.indexOf(marker);
    if (idx === -1) return null;
    return parsed.pathname.slice(idx + marker.length);
  } catch {
    return null;
  }
};

export async function PATCH(request) {
  try {
    // --- create supabase server client (same pattern you used elsewhere) ---
    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);

    // --- parse form data ---
    const formData = await request.formData();
    const artistIdRaw = formData.get("artistId");
    const artistId = artistIdRaw ? String(artistIdRaw).trim() : null;

    if (!artistId) {
      return NextResponse.json(
        { error: "Artist ID is required" },
        { status: 400 },
      );
    }

    // --- get user from supabase auth ---
    const authResp = await supabase.auth.getUser();
    const authError = authResp.error;
    const user = authResp.data?.user ?? null;

    if (authError || !user) {
      console.error("Auth error or no user:", authError);
      return NextResponse.json(
        { error: "Unauthorized: Please log in" },
        { status: 401 },
      );
    }

    let submittedArtistId = null;
    let isAdmin = false;

    if (user.submitted_artist_id)
      submittedArtistId = String(user.submitted_artist_id).trim();
    else if (user.user_metadata && user.user_metadata.submitted_artist_id)
      submittedArtistId = String(user.user_metadata.submitted_artist_id).trim();

    if (!submittedArtistId) {
      // Fallback: read it from a profile table (common pattern). Adjust table name/column if needed.
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("submitted_artist_id, is_admin")
        .eq("id", user.id)
        .single();

      if (!profileError && profile) {
        submittedArtistId = profile.submitted_artist_id
          ? String(profile.submitted_artist_id).trim()
          : null;
        isAdmin = profile.is_admin || false;
      } else {
        // Not fatal — just log for debug
        if (profileError) console.warn("profiles query error:", profileError);
      }
    } else {
      // Also fetch is_admin if we already have submitted_artist_id
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (!profileError && profile) {
        isAdmin = profile.is_admin || false;
      }
    }

    // --- debug log (server-side only) ---
    console.log("DEBUG update-artist owner-check", {
      userId: user.id,
      submittedArtistId,
      artistId,
      isAdmin,
    });

    // --- ownership check (allow admins to bypass) ---
    if (!isAdmin && (!submittedArtistId || submittedArtistId !== artistId)) {
      // IMPORTANT: avoid leaking sensitive data in production responses; these details are helpful while debugging.
      return NextResponse.json(
        {
          error: "You can only update your own submitted artist",
          submittedArtistId,
          artistId,
        },
        { status: 403 },
      );
    }

    // --- Build update payload (only allowed fields) ---
    const allowedFields = [
      "name",
      "stage_name",
      "country",
      "city",
      "sex",
      "is_band",
      "birth",
      "desc",
      "bio",
      "genres",
      "social_links",
      "label",
    ];

    function tryParseJSON(value) {
      if (typeof value !== "string") return value;
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }

    const updateFields = {};

    // Fetch existing artist image for cleanup (only if we are uploading a new one)
    let existingArtistImage = null;
    if (formData.get("artist_image")) {
      const { data: existingArtist, error: existingError } = await supabase
        .from("artists")
        .select("artist_image")
        .eq("id", artistId)
        .single();

      if (existingError) {
        console.error("Failed to fetch existing artist image:", existingError);
      } else {
        existingArtistImage = existingArtist?.artist_image || null;
      }
    }

    // Handle artist_image separately (file upload)
    const artist_image = formData.get("artist_image");
    let artistImageUrl = null;

    if (artist_image && artist_image instanceof File && artist_image.size > 0) {
      const oldImagePath = extractArtistImagePath(existingArtistImage);

      if (oldImagePath) {
        const { error: removeError } = await supabaseAdmin.storage
          .from("artist_profile_images")
          .remove([oldImagePath]);

        if (removeError) {
          console.error("Failed to remove old artist image:", removeError);
        }
      }

      // Validate file type
      if (!artist_image.type.startsWith("image/")) {
        return NextResponse.json(
          { error: "Please upload a valid image file" },
          { status: 400 },
        );
      }

      // Validate file size (1MB limit)
      if (artist_image.size > 1 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Image size must be less than 1MB" },
          { status: 400 },
        );
      }

      // Generate unique filename
      const randomId = Math.random().toString(36).substring(2, 15);
      const fileExtension = artist_image.name.split(".").pop();
      const fileName = `artist_${Date.now()}_${randomId}.${fileExtension}`;

      // Upload image to Supabase storage
      const { data: uploadData, error: uploadError } =
        await supabaseAdmin.storage
          .from("artist_profile_images")
          .upload(fileName, artist_image, {
            cacheControl: "3600",
            upsert: false,
          });

      if (uploadError) {
        console.error("Image upload error:", uploadError);
        return NextResponse.json(
          { error: "Failed to upload image", details: uploadError.message },
          { status: 500 },
        );
      }

      // Get public URL for the uploaded image
      const {
        data: { publicUrl },
      } = supabaseAdmin.storage
        .from("artist_profile_images")
        .getPublicUrl(fileName);

      artistImageUrl = publicUrl;
      updateFields.artist_image = artistImageUrl;
    }

    // Process other fields
    for (const field of allowedFields) {
      // Support both single entries and multiple entries (FormData.getAll)
      const all = formData.getAll(field);
      if (all && all.length > 1) {
        // multiple values => use array (try parse JSON each entry)
        updateFields[field] = all.map((v) => tryParseJSON(String(v)));
        continue;
      }

      const val = formData.get(field);
      if (val === null) continue;

      // If the client sent JSON string for arrays, try parse, otherwise use string
      const parsed = tryParseJSON(String(val));
      updateFields[field] = parsed;
    }

    // Convert is_band from string to boolean
    if (updateFields.is_band !== undefined) {
      updateFields.is_band =
        updateFields.is_band === "true" || updateFields.is_band === true;

      // If is_band is true, set birth to null
      if (updateFields.is_band) {
        updateFields.birth = null;
      }
    }

    updateFields.updated_at = new Date().toISOString();

    // --- perform update ---
    const { data: updatedArtist, error: updateError } = await supabase
      .from("artists")
      .update(updateFields)
      .eq("id", artistId)
      .select()
      .single();

    if (updateError) {
      console.error("Supabase update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update artist" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "Artist updated successfully",
      data: updatedArtist,
    });
  } catch (err) {
    console.error("Unexpected error in update-artist:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
