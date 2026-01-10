import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerUser, supabaseAdmin } from "@/app/lib/config/supabaseServer";

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const { user, error: userError } = await getServerUser(cookieStore);

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!user.is_admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    const mergedData = await request.json();

    console.log("🎤 Inserting merged artist (RA + MusicBrainz):", mergedData);

    // Validate required fields
    if (!mergedData.name && !mergedData.stage_name) {
      return NextResponse.json(
        { success: false, error: "Artist name is required" },
        { status: 400 }
      );
    }

    const stageName = mergedData.stage_name || mergedData.name;
    const fullName = mergedData.name;

    // Check if artist exists by stage_name or musicbrainz_artist_id
    let existingArtist = null;

    if (mergedData.musicbrainz_artist_id) {
      const { data } = await supabaseAdmin
        .from("artists")
        .select("*")
        .eq("musicbrainz_artist_id", mergedData.musicbrainz_artist_id)
        .maybeSingle();
      existingArtist = data;
    }

    if (!existingArtist) {
      const { data } = await supabaseAdmin
        .from("artists")
        .select("*")
        .eq("stage_name", stageName)
        .maybeSingle();
      existingArtist = data;
    }

    if (existingArtist) {
      // Artist exists - update with merged data (only null fields)
      const updateData = {};

      if (!existingArtist.name && fullName) {
        updateData.name = fullName;
      }

      if (!existingArtist.stage_name && stageName) {
        updateData.stage_name = stageName;
      }

      if (!existingArtist.sex && mergedData.sex) {
        updateData.sex = mergedData.sex;
      }

      if (!existingArtist.birth && mergedData.birth) {
        // Validate birth date format (YYYY-MM-DD)
        const birthDate = mergedData.birth;
        updateData.birth =
          birthDate && birthDate.match(/^\d{4}-\d{2}-\d{2}$/)
            ? birthDate
            : null;
      }

      if (!existingArtist.country && mergedData.country) {
        updateData.country = mergedData.country;
      }

      if (!existingArtist.city && mergedData.city) {
        updateData.city = mergedData.city;
      }

      if (
        (!existingArtist.social_links ||
          existingArtist.social_links.length === 0) &&
        mergedData.social_links &&
        mergedData.social_links.length > 0
      ) {
        updateData.social_links = mergedData.social_links;
      } else if (
        existingArtist.social_links &&
        mergedData.social_links &&
        mergedData.social_links.length > 0
      ) {
        // Merge social links - remove duplicates
        const combined = [
          ...existingArtist.social_links,
          ...mergedData.social_links,
        ];
        updateData.social_links = [...new Set(combined)];
      }

      if (
        (!existingArtist.genres || existingArtist.genres.length === 0) &&
        mergedData.genres &&
        mergedData.genres.length > 0
      ) {
        updateData.genres = mergedData.genres;
      } else if (
        existingArtist.genres &&
        mergedData.genres &&
        mergedData.genres.length > 0
      ) {
        // Merge genres - remove duplicates
        const combined = [...existingArtist.genres, ...mergedData.genres];
        updateData.genres = [...new Set(combined)];
      }

      if (
        (!existingArtist.label || existingArtist.label.length === 0) &&
        mergedData.label &&
        mergedData.label.length > 0
      ) {
        updateData.label = mergedData.label;
      } else if (
        existingArtist.label &&
        mergedData.label &&
        mergedData.label.length > 0
      ) {
        // Merge labels - remove duplicates
        const combined = [...existingArtist.label, ...mergedData.label];
        updateData.label = [...new Set(combined)];
      }

      if (!existingArtist.bio && mergedData.bio) {
        updateData.bio = mergedData.bio;
      }

      if (!existingArtist.artist_image && mergedData.artist_image) {
        updateData.artist_image = mergedData.artist_image;
      }

      if (
        !existingArtist.musicbrainz_artist_id &&
        mergedData.musicbrainz_artist_id
      ) {
        updateData.musicbrainz_artist_id = mergedData.musicbrainz_artist_id;
      }

      // Check if there's anything to update
      if (Object.keys(updateData).length === 0) {
        return NextResponse.json({
          success: true,
          message: `Artist "${stageName}" already has all fields populated. No updates needed.`,
          updated: false,
          artistId: existingArtist.id,
          artist: existingArtist,
        });
      }

      // Update the artist
      const { data: updatedArtist, error: updateError } = await supabaseAdmin
        .from("artists")
        .update(updateData)
        .eq("id", existingArtist.id)
        .select()
        .single();

      if (updateError) {
        console.error("❌ Error updating artist:", updateError);
        return NextResponse.json(
          { success: false, error: updateError.message },
          { status: 500 }
        );
      }

      console.log("✅ Artist updated:", updatedArtist);

      return NextResponse.json({
        success: true,
        message: `Artist "${stageName}" updated successfully with merged data!`,
        updated: true,
        artistId: updatedArtist.id,
        artist: updatedArtist,
        fieldsUpdated: Object.keys(updateData),
      });
    } else {
      // Insert new artist with merged data
      // Validate birth date format (YYYY-MM-DD)
      const birthDate = mergedData.birth;
      const validBirthDate =
        birthDate && birthDate.match(/^\d{4}-\d{2}-\d{2}$/) ? birthDate : null;

      const insertData = {
        name: fullName,
        stage_name: stageName,
        sex: mergedData.sex || null,
        birth: validBirthDate,
        country: mergedData.country || null,
        city: mergedData.city || null,
        social_links: mergedData.social_links || [],
        genres: mergedData.genres || [],
        label: mergedData.label || [],
        bio: mergedData.bio || null,
        artist_image: mergedData.artist_image || null,
        musicbrainz_artist_id: mergedData.musicbrainz_artist_id || null,
        // Additional fields from RA
        desc: mergedData.bio ? mergedData.bio.substring(0, 200) : null,
      };

      const { data: newArtist, error: insertError } = await supabaseAdmin
        .from("artists")
        .insert([insertData])
        .select()
        .single();

      if (insertError) {
        console.error("❌ Error inserting artist:", insertError);
        return NextResponse.json(
          { success: false, error: insertError.message },
          { status: 500 }
        );
      }

      console.log("✅ New artist inserted:", newArtist);

      return NextResponse.json({
        success: true,
        message: `Artist "${stageName}" inserted successfully with merged data!`,
        artistId: newArtist.id,
        artist: newArtist,
      });
    }
  } catch (error) {
    console.error("❌ Error in insert-merged-artist:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to insert/update artist",
      },
      { status: 500 }
    );
  }
}
