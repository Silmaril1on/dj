import { NextResponse } from "next/server";
import { getDistanceToVenue } from "@/app/lib/services/distance/getDistance";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const origin = searchParams.get("origin"); // "lat,lng"
  const destination = searchParams.get("destination"); // address or "lat,lng"

  if (!origin || !destination) {
    return NextResponse.json(
      { error: "origin and destination are required" },
      { status: 400 },
    );
  }

  const result = await getDistanceToVenue(origin, destination);
  if (!result) {
    return NextResponse.json(
      { error: "Could not calculate distance" },
      { status: 502 },
    );
  }

  return NextResponse.json(result);
}
