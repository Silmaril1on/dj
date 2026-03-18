import { NextResponse } from "next/server";
import { getServerUser } from "@/app/lib/config/supabaseServer";
import { cookies } from "next/headers";
import { getArtisForHomePage } from "@/app/lib/services/artists/artistProfile";

export async function GET() {
  try {
    const cookieStore = await cookies();
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
