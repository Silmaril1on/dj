import { NextResponse } from "next/server";
import {
  createSupabaseServerClient,
  getServerUser,
} from "@/app/lib/config/supabaseServer";
import { cookies } from "next/headers";
import { getArtisForHomePage } from "@/app/lib/services/artists/artistProfile";

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const { searchParams } = new URL(request.url);
    const fieldsParam = searchParams.get("fields");
    const limitParam = Number(searchParams.get("limit"));

    if (fieldsParam || searchParams.has("limit")) {
      const supabase = await createSupabaseServerClient(cookieStore);
      const fields = fieldsParam
        ? fieldsParam
            .split(",")
            .map((field) => field.trim())
            .filter(Boolean)
            .join(",")
        : "id, name, stage_name, artist_slug, image_url";

      let query = supabase
        .from("artists")
        .select(fields)
        .eq("status", "approved");

      if (Number.isFinite(limitParam) && limitParam > 0) {
        query = query.limit(limitParam);
      }

      const { data, error } = await query;
      if (error) {
        throw error;
      }

      return NextResponse.json({ artists: data || [] });
    }
    const { user, error: userError } = await getServerUser(cookieStore);

    let userId = null;
    if (user && !userError) {
      userId = user.id;
    }

    const artists = await getArtisForHomePage(cookieStore, userId);

    return NextResponse.json({ artists });
  } catch (error) {
    console.error("Artists homepage API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 },
    );
  }
}
