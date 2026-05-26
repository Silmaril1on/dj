import { NextResponse } from "next/server";
import { searchEventsByArtists } from "@/app/lib/services/events/enhancedSearch";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const raw = searchParams.get("artists") || "";
    const artistNames = raw
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean);

    if (artistNames.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one artist name is required" },
        { status: 400 },
      );
    }

    const result = await searchEventsByArtists(artistNames);
    return NextResponse.json(result, {
      headers: {
        // Allow CDN/browser to cache for up to 5 min; stale-while-revalidate 25 min
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=1500",
      },
    });
  } catch (error) {
    console.error("enhanced-search error:", error);
    return NextResponse.json(
      { success: false, error: "Search failed" },
      { status: 500 },
    );
  }
}
