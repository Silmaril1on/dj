import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerUser } from "@/app/lib/config/supabaseServer";
import {
  getPendingSchedules,
  approvePendingSchedule,
  declinePendingSchedule,
} from "@/app/lib/services/user/pending-schedule/pendingSchedule";

async function getAuthUser() {
  const cookieStore = await cookies();
  return getServerUser(cookieStore);
}

export async function GET() {
  try {
    const { user, error } = await getAuthUser();
    if (error || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const schedules = await getPendingSchedules(user.id);
    return NextResponse.json({ schedules });
  } catch (err) {
    console.error("Pending schedule GET error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { user, error } = await getAuthUser();
    if (error || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const { id } = await request.json();
    if (!id)
      return NextResponse.json({ error: "ID required" }, { status: 400 });

    await approvePendingSchedule(id, user.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const status =
      err.message === "Unauthorized"
        ? 403
        : err.message === "Not found"
          ? 404
          : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}

export async function DELETE(request) {
  try {
    const { user, error } = await getAuthUser();
    if (error || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const id = new URL(request.url).searchParams.get("id");
    if (!id)
      return NextResponse.json({ error: "ID required" }, { status: 400 });

    await declinePendingSchedule(id, user.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const status =
      err.message === "Unauthorized"
        ? 403
        : err.message === "Not found"
          ? 404
          : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
