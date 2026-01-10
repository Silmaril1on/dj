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

    const raArtistData = await request.json();

    console.log("🎤 Inserting RA artist:", raArtistData);

    // Prepare mapped data
    const stageName = raArtistData.artistName;
    const fullName =
      `${raArtistData.firstName || ""} ${raArtistData.lastName || ""}`.trim();

    // Collect social links (only non-null values)
    const socialLinks = [
      raArtistData.facebook,
      raArtistData.soundcloud,
      raArtistData.instagram,
      raArtistData.twitter,
      raArtistData.website,
    ].filter(Boolean);

    const labels =
      raArtistData.artistLabels?.map((label) => label.labelName) || [];

    if (!stageName) {
      return NextResponse.json(
        { success: false, error: "Artist name is required" },
        { status: 400 }
      );
    }

    // Check if artist exists by stage_name
    const { data: existingArtist } = await supabaseAdmin
      .from("artists")
      .select("*")
      .eq("stage_name", stageName)
      .maybeSingle();

    if (existingArtist) {
      // Artist exists - only update NULL fields
      const updateData = {};

      if (!existingArtist.name && fullName) {
        updateData.name = fullName;
      }

      if (
        (!existingArtist.social_links ||
          existingArtist.social_links.length === 0) &&
        socialLinks.length > 0
      ) {
        updateData.social_links = socialLinks;
      }

      if (!existingArtist.desc && raArtistData.blurb) {
        updateData.desc = raArtistData.blurb;
      }

      if (!existingArtist.bio && raArtistData.bio) {
        updateData.bio = raArtistData.bio;
      }

      if (
        (!existingArtist.label || existingArtist.label.length === 0) &&
        labels.length > 0
      ) {
        updateData.label = labels;
      }

      // Check if there's anything to update
      if (Object.keys(updateData).length === 0) {
        return NextResponse.json({
          success: true,
          message: `Artist "${stageName}" already has all fields populated. No updates needed.`,
          updated: false,
          artist: existingArtist,
        });
      }

      // Update only null fields
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

      console.log("✅ Artist updated successfully:", updatedArtist.id);
      console.log("📝 Updated fields:", Object.keys(updateData));

      return NextResponse.json({
        success: true,
        message: `Artist "${stageName}" updated with missing fields!`,
        updated: true,
        updatedFields: Object.keys(updateData),
        artist: updatedArtist,
      });
    } else {
      // Artist doesn't exist - create new
      const insertData = {
        stage_name: stageName,
        name: fullName || null,
        social_links: socialLinks,
        desc: raArtistData.blurb || null,
        bio: raArtistData.bio || null,
        label: labels,
        status: "pending",
        user_id: null,
      };

      console.log(
        "📝 Insert data prepared:",
        JSON.stringify(insertData, null, 2)
      );

      const { data: newArtist, error: insertError } = await supabaseAdmin
        .from("artists")
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        console.error("❌ Error inserting artist:", insertError);
        return NextResponse.json(
          { success: false, error: insertError.message },
          { status: 500 }
        );
      }

      console.log("✅ Artist inserted successfully:", newArtist.id);

      return NextResponse.json({
        success: true,
        message: `Artist "${stageName}" inserted successfully!`,
        updated: false,
        artist: newArtist,
      });
    }
  } catch (error) {
    console.error("❌ Error in insert-ra-artist API:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
