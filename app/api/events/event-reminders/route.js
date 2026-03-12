import { NextResponse } from "next/server";
import {
  createSupabaseServerClient,
  getServerUser,
} from "@/app/lib/config/supabaseServer";
import { cookies } from "next/headers";
import { revalidateTag } from "next/cache";

const ALLOWED_REMINDER_OFFSETS = [3, 7, 14, 30];

const normalizeReminderOffset = (value) => {
  const parsed = Number.parseInt(String(value), 10);
  return ALLOWED_REMINDER_OFFSETS.includes(parsed) ? parsed : null;
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 },
      );
    }

    const cookieStore = await cookies();
    const { user, error: userError } = await getServerUser(cookieStore);

    if (userError || !user) {
      return NextResponse.json({ success: true, isReminderSet: false });
    }

    const supabase = await createSupabaseServerClient(cookieStore);
    const { data, error } = await supabase
      .from("event_reminders")
      .select("id, reminder_offset_days")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      return NextResponse.json(
        { error: "Failed to fetch reminder status" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      isReminderSet: Boolean(data),
      reminderOffsetDays: data?.reminder_offset_days ?? null,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const { user, error: userError } = await getServerUser(cookieStore);

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "User not authenticated" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { eventId, reminderOffsetDays, action } = body;

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 },
      );
    }

    if (action === "remove") {
      const supabase = await createSupabaseServerClient(cookieStore);
      const { error: deleteError } = await supabase
        .from("event_reminders")
        .delete()
        .eq("event_id", eventId)
        .eq("user_id", user.id);

      if (deleteError) {
        return NextResponse.json(
          { error: "Failed to remove reminder" },
          { status: 500 },
        );
      }

      revalidateTag("events");
      revalidateTag("event-reminders");
      revalidateTag(`event-${eventId}`);

      return NextResponse.json({
        success: true,
        isReminderSet: false,
        reminderOffsetDays: null,
      });
    }

    const normalizedOffset = normalizeReminderOffset(reminderOffsetDays);
    if (!normalizedOffset) {
      return NextResponse.json(
        { error: "Invalid reminder offset. Use 3, 7, 14, or 30 days." },
        { status: 400 },
      );
    }

    const supabase = await createSupabaseServerClient(cookieStore);
    const { error: upsertError } = await supabase
      .from("event_reminders")
      .upsert(
        {
          event_id: eventId,
          user_id: user.id,
          reminder_sent: false,
          reminder_offset_days: normalizedOffset,
        },
        {
          onConflict: "event_id,user_id",
        },
      );

    if (upsertError) {
      return NextResponse.json(
        { error: "Failed to set reminder", details: upsertError.message },
        { status: 500 },
      );
    }

    revalidateTag("events");
    revalidateTag("event-reminders");
    revalidateTag(`event-${eventId}`);

    return NextResponse.json({
      success: true,
      isReminderSet: true,
      reminderOffsetDays: normalizedOffset,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
