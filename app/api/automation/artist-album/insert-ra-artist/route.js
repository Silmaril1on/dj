import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerUser, supabaseAdmin } from "@/app/lib/config/supabaseServer";

const ALLOWED_SOCIAL_KEYS = [
  "facebook",
  "soundcloud",
  "instagram",
  "twitter",
  "website",
];

function buildInsertPayload(ra) {
  const firstName = (ra.firstName || "").trim();
  const lastName = (ra.lastName || "").trim();
  const fullName =
    firstName && lastName
      ? `${firstName} ${lastName}`
      : firstName || lastName || ra.artistName || null;

  const socialLinks = ALLOWED_SOCIAL_KEYS.map((key) => ra[key]).filter(Boolean);

  return {
    name: fullName,
    stage_name: ra.artistName || null,
    desc: ra.blurb || null,
    bio: ra.bio || null,
    status: "pending",
    artist_slug: ra.urlSafeName || null,
    social_links: socialLinks,
    label: ra.artistLabels
      ? ra.artistLabels.map((l) => l.labelName).filter(Boolean)
      : [],
    country: ra.artistAreas?.[0]?.countryUrl || null,
    city: ra.artistAreas?.[0]?.areaName || null,
    artist_image: ra.image || null,
  };
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const { user, error: userError } = await getServerUser(cookieStore);

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    if (!user.is_admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Admin access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    // Accept a single artist object or an array
    const artistsInput = Array.isArray(body) ? body : [body];

    if (artistsInput.length === 0) {
      return NextResponse.json(
        { success: false, error: "No artist data provided" },
        { status: 400 },
      );
    }

    const results = { inserted: [], skipped: [], errors: [] };

    for (const ra of artistsInput) {
      const stageName = ra.artistName;
      if (!stageName) {
        results.errors.push({ artist: ra, reason: "Missing artistName" });
        continue;
      }

      // Duplicate check by stage_name or name
      const { data: existing } = await supabaseAdmin
        .from("artists")
        .select("id, stage_name, name")
        .or(`stage_name.eq."${stageName}",name.eq."${stageName}"`)
        .maybeSingle();

      if (existing) {
        results.skipped.push({
          artistName: stageName,
          reason: "Already exists",
          id: existing.id,
        });
        continue;
      }

      const payload = buildInsertPayload(ra);

      const { data: newArtist, error: insertError } = await supabaseAdmin
        .from("artists")
        .insert([payload])
        .select("id, stage_name, name")
        .single();

      if (insertError) {
        console.error(`❌ Error inserting "${stageName}":`, insertError);
        results.errors.push({
          artistName: stageName,
          reason: insertError.message,
        });
        continue;
      }

      results.inserted.push({ artistName: stageName, id: newArtist.id });
      console.log(`✅ Inserted artist: ${stageName}`);
    }

    const { inserted, skipped, errors } = results;

    return NextResponse.json({
      success: true,
      message: `${inserted.length} artist(s) inserted, ${skipped.length} skipped (already exist), ${errors.length} error(s).`,
      results,
      summary: {
        total: artistsInput.length,
        inserted: inserted.length,
        skipped: skipped.length,
        errors: errors.length,
      },
    });
  } catch (error) {
    console.error("❌ Error in insert-ra-artist:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to insert artists" },
      { status: 500 },
    );
  }
}
