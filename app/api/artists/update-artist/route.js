import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/app/lib/config/supabaseServer";

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
        { status: 400 }
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
        { status: 401 }
      );
    }

    let submittedArtistId = null;

    if (user.submitted_artist_id)
      submittedArtistId = String(user.submitted_artist_id).trim();
    else if (user.user_metadata && user.user_metadata.submitted_artist_id)
      submittedArtistId = String(user.user_metadata.submitted_artist_id).trim();

    if (!submittedArtistId) {
      // Fallback: read it from a profile table (common pattern). Adjust table name/column if needed.
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("submitted_artist_id")
        .eq("id", user.id)
        .single();

      if (!profileError && profile) {
        submittedArtistId = profile.submitted_artist_id
          ? String(profile.submitted_artist_id).trim()
          : null;
      } else {
        // Not fatal — just log for debug
        if (profileError) console.warn("profiles query error:", profileError);
      }
    }

    // --- debug log (server-side only) ---
    console.log("DEBUG update-artist owner-check", {
      userId: user.id,
      submittedArtistId,
      artistId,
    });

    // --- ownership check ---
    if (!submittedArtistId || submittedArtistId !== artistId) {
      // IMPORTANT: avoid leaking sensitive data in production responses; these details are helpful while debugging.
      return NextResponse.json(
        {
          error: "You can only update your own submitted artist",
          submittedArtistId,
          artistId,
        },
        { status: 403 }
      );
    }

    // --- Build update payload (only allowed fields) ---
    const allowedFields = [
      "name",
      "stage_name",
      "country",
      "city",
      "sex",
      "birth",
      "desc",
      "bio",
      "genres",
      "social_links",
      "label",
      "artist_image",
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

      // If it's a File (upload), parsed will be "[object File]" — handle files separately if you want upload flow.
      // For now expect URL string for artist_image from your frontend.
      updateFields[field] = parsed;
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
        { status: 500 }
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
      { status: 500 }
    );
  }
}
