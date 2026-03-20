import { NextResponse } from "next/server";
import { getAllFestivals } from "@/app/lib/services/festivals/festival";
import { ServiceError } from "@/app/lib/services/submit-data-types/shared";

// This route is kept for backward compatibility.
// Prefer using GET /api/festivals directly.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await getAllFestivals({
      limit: parseInt(searchParams.get("limit") || "20", 10),
      offset: parseInt(searchParams.get("offset") || "0", 10),
      country: searchParams.get("country") || null,
      name: searchParams.get("name") || null,
      sort: searchParams.get("sort") || null,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
