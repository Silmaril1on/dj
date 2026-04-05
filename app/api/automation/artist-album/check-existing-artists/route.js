import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerUser, supabaseAdmin } from "@/app/lib/config/supabaseServer";

/**
 * POST /api/automation/artist-album/check-existing-artists
 * Body: { names: string[] }
 * Returns which artistNames already exist in the artists table (by stage_name or name).
 */
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

    const { names } = await request.json();

    if (!Array.isArray(names) || names.length === 0) {
      return NextResponse.json(
        { success: false, error: "names array is required" },
        { status: 400 },
      );
    }

    const uniqueNames = [...new Set(names.filter(Boolean))];

    // Fetch all artists whose stage_name OR name is in the list
    const { data: existingArtists, error } = await supabaseAdmin
      .from("artists")
      .select("id, stage_name, name")
      .or(
        uniqueNames.map((n) => `stage_name.eq."${n}",name.eq."${n}"`).join(","),
      );

    if (error) {
      console.error("❌ Error checking existing artists:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    const existingNames = new Set(
      (existingArtists || []).flatMap((a) =>
        [a.stage_name, a.name].filter(Boolean),
      ),
    );

    const alreadyExist = uniqueNames.filter((n) => existingNames.has(n));
    const newArtists = uniqueNames.filter((n) => !existingNames.has(n));

    return NextResponse.json({
      success: true,
      total: uniqueNames.length,
      alreadyExist,
      newArtists,
      summary: {
        total: uniqueNames.length,
        alreadyExist: alreadyExist.length,
        new: newArtists.length,
      },
    });
  } catch (error) {
    console.error("❌ Error in check-existing-artists:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
