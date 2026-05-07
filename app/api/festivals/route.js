import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getAllFestivals,
  getFestivalById,
  createFestival,
  updateFestival,
} from "@/app/lib/services/festivals/festival";
import { ServiceError } from "@/app/lib/services/shared";
import { getServerUser } from "@/app/lib/config/supabaseServer";
import {
  checkRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/app/lib/rateLimit";

const handleError = (error) => {
  if (error instanceof ServiceError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
};

export async function GET(request) {
  const ip = getClientIp(request);
  const id = new URL(request.url).searchParams.get("id");
  // Only rate-limit the listing endpoint, not single fetches
  if (!id) {
    const rl = checkRateLimit(`festivals-list:${ip}`, 60, 60_000);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt);
  }

  try {
    const { searchParams } = new URL(request.url);
    const cookieStore = await cookies();
    const { user } = await getServerUser(cookieStore);

    const id = searchParams.get("id");
    if (id) {
      const [result] = await Promise.all([getFestivalById(id, cookieStore)]);

      return NextResponse.json({
        success: true,
        ...result,
        currentUserId: user?.id ?? null,
      });
    }

    const result = await getAllFestivals({
      limit: parseInt(searchParams.get("limit") || "20", 10),
      offset: parseInt(searchParams.get("offset") || "0", 10),
      country: searchParams.get("country") || null,
      name: searchParams.get("name") || null,
      sort: searchParams.get("sort") || null,
      userId: user?.id ?? null,
    });
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const formData = await request.formData();
    const result = await createFestival(formData, cookieStore);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request) {
  try {
    const cookieStore = await cookies();
    const formData = await request.formData();
    const result = await updateFestival(formData, cookieStore);
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}
