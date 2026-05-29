import { NextResponse } from "next/server";
import { getGlobeFestivals } from "@/app/lib/services/festivals/globeFestivals";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const festivals = await getGlobeFestivals();
    return NextResponse.json({ success: true, festivals });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: err.status || 500 },
    );
  }
}
