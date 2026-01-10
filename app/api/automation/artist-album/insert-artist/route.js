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

    const artistData = await request.json();

    console.log("🎤 Inserting artist from MusicBrainz:", artistData);

    // Validate required fields - need at least a name (real name or stage name)
    if (!artistData.name && !artistData.stage_name) {
      return NextResponse.json(
        { success: false, error: "Artist name is required (name or stage_name)" },
        { status: 400 }
      );
    }

    // Check if artist already exists by MusicBrainz ID
    if (artistData.musicbrainz_artist_id) {
      const { data: existingArtist } = await supabaseAdmin
        .from("artists")
        .select("id, stage_name")
        .eq("musicbrainz_artist_id", artistData.musicbrainz_artist_id)
        .maybeSingle();

      if (existingArtist) {
        return NextResponse.json(
          {
            success: false,
            error: `Artist "${existingArtist.stage_name}" already exists in database`,
          },
          { status: 409 }
        );
      }
    }

    // Prepare insert data
    const insertData = {
      name: artistData.name || null,
      stage_name: artistData.stage_name || null,
      sex: artistData.sex || null,
      birth: artistData.birth || null,
      country: artistData.country || null,
      city: artistData.city || null,
      social_links: artistData.social_links || [],
      genres: artistData.genres || [],
      musicbrainz_artist_id: artistData.musicbrainz_artist_id || null,
      status: "pending",
      user_id: null,
    };

    console.log(
      "📝 Insert data prepared:",
      JSON.stringify(insertData, null, 2)
    );

    // Insert artist into database
    const { data: newArtist, error: insertError } = await supabaseAdmin
      .from("artists")
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error("❌ Error inserting artist:", insertError);
      console.error("❌ Error details:", JSON.stringify(insertError, null, 2));
      console.error(
        "❌ Data that failed:",
        JSON.stringify(insertData, null, 2)
      );
      return NextResponse.json(
        {
          success: false,
          error: insertError.message || insertError.details || "Database error",
        },
        { status: 500 }
      );
    }

    console.log("✅ Artist inserted successfully:", newArtist.id);

    return NextResponse.json({
      success: true,
      message: `Artist "${newArtist.stage_name}" inserted successfully!`,
      artist: newArtist,
    });
  } catch (error) {
    console.error("❌ Error in insert-artist API:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
