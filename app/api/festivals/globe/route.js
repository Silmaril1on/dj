import { NextResponse } from "next/server";
import { getGlobeFestivals } from "@/app/lib/services/festivals/globeFestivals";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await getGlobeFestivals({
      limit: searchParams.get("limit") || undefined,
      offset: searchParams.get("offset") || undefined,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: err.status || 500 },
    );
  }
}
