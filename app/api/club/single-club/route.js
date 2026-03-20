import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getClubById } from "@/app/lib/services/clubs/clubs";
import { ServiceError } from "@/app/lib/services/shared";
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

export async function GET(request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    const cookieStore = await cookies();
    const [result, { user }] = await Promise.all([
      getClubById(id, cookieStore),
      getServerUser(cookieStore),
    ]);
    return NextResponse.json({ ...result, currentUserId: user?.id ?? null });
  } catch (error) {
    return handleError(error);
  }
}
