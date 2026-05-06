import { NextResponse } from "next/server";
import { getRelatedFestivals } from "@/app/lib/services/festivals/getRelatedFestivals";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const festivalId = searchParams.get("festivalId");
    const country = searchParams.get("country");

    if (!festivalId || !country) {
      return NextResponse.json({ festivals: [] });
    }

    const festivals = await getRelatedFestivals(festivalId, country);
    return NextResponse.json({ festivals });
  } catch (err) {
    console.error("Related festivals error:", err);
    return NextResponse.json({ festivals: [] });
  }
}
