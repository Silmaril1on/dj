import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getFestivalById } from "@/app/lib/services/festivals/festival";
import { ServiceError } from "@/app/lib/services/submit-data-types/shared";
import { getServerUser } from "@/app/lib/config/supabaseServer";

const handleError = (error) => {
  if (error instanceof ServiceError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
};

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const [result, { user }] = await Promise.all([
      getFestivalById(id, cookieStore),
      getServerUser(cookieStore),
    ]);
    return NextResponse.json({
      success: true,
      ...result,
      currentUserId: user?.id ?? null,
    });
  } catch (error) {
    return handleError(error);
  }
}
