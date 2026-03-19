import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  fetchNotifications,
  markAllNotificationsRead,
  createNotification,
} from "@/app/lib/services/admin/notifications/getNotifications";
import { ServiceError } from "@/app/lib/services/submit-data-types/shared";

const handleError = (error) => {
  if (error instanceof ServiceError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status },
    );
  }
  console.error("❌ [NOTIFICATIONS] error:", error);
  return NextResponse.json(
    { success: false, error: "Internal server error" },
    { status: 500 },
  );
};

export async function GET() {
  try {
    const cookieStore = await cookies();
    const result = await fetchNotifications(cookieStore);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const body = await req.json();

    if (body.action === "mark-all-read") {
      const result = await markAllNotificationsRead(cookieStore);
      return NextResponse.json(result, { status: 200 });
    }

    const result = await createNotification(cookieStore, body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
