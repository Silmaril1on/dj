import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerUser } from "@/app/lib/config/supabaseServer";
import { fetchArtists } from "@/app/lib/services/artists/getAllArtists";
import {
  checkRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/app/lib/rateLimit";

export async function GET(request) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`artists-list:${ip}`, 60, 60_000);
  if (!rl.allowed) return rateLimitResponse(rl.resetAt);

  try {
    const qp = new URL(request.url).searchParams;
    const cookieStore = await cookies();
    const { user } = await getServerUser(cookieStore);

    const result = await fetchArtists({
      limit: parseInt(qp.get("limit") || "20", 10),
      offset: parseInt(qp.get("offset") || "0", 10),
      country: qp.get("country") || null,
      name: qp.get("name") || null,
      sex: qp.get("sex") || null,
      genre: qp.get("genres") || null,
      birthDecade: qp.get("birth_decade") || null,
      ratingRange: qp.get("rating_range") || null,
      sort: qp.get("sort") || null,
      userId: user?.id ?? null,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in GET get-all-artists API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
