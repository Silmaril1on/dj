"use server";
import { revalidateTag } from "next/cache";
import {
  ServiceError,
  getAuthenticatedContext,
} from "@/app/lib/services/submit-data-types/shared";

const ALLOWED_OFFSETS = [3, 7, 14, 30];

const normalizeOffset = (value) => {
  const parsed = parseInt(String(value), 10);
  return ALLOWED_OFFSETS.includes(parsed) ? parsed : null;
};

export async function getEventReminder(cookieStore, eventId) {
  if (!eventId) throw new ServiceError("Event ID is required", 400);

  try {
    const { user, supabase } = await getAuthenticatedContext(cookieStore);
    const { data, error } = await supabase
      .from("event_reminders")
      .select("id, reminder_offset_days")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new ServiceError("Failed to fetch reminder status", 500);
    }

    return {
      isReminderSet: Boolean(data),
      reminderOffsetDays: data?.reminder_offset_days ?? null,
    };
  } catch (err) {
    if (err instanceof ServiceError) throw err;
    // unauthenticated
    return { isReminderSet: false, reminderOffsetDays: null };
  }
}

export async function setEventReminder(
  cookieStore,
  { eventId, reminderOffsetDays, action },
) {
  if (!eventId) throw new ServiceError("Event ID is required", 400);
  const { user, supabase } = await getAuthenticatedContext(cookieStore);

  if (action === "remove") {
    const { error } = await supabase
      .from("event_reminders")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", user.id);
    if (error) throw new ServiceError("Failed to remove reminder", 500);

    revalidateTag("events");
    revalidateTag("event-reminders");
    revalidateTag(`event-${eventId}`);

    return { isReminderSet: false, reminderOffsetDays: null };
  }

  const normalizedOffset = normalizeOffset(reminderOffsetDays);
  if (!normalizedOffset) {
    throw new ServiceError(
      "Invalid reminder offset. Use 3, 7, 14, or 30 days.",
      400,
    );
  }

  const { error } = await supabase
    .from("event_reminders")
    .upsert(
      {
        event_id: eventId,
        user_id: user.id,
        reminder_sent: false,
        reminder_offset_days: normalizedOffset,
      },
      { onConflict: "event_id,user_id" },
    );
  if (error) throw new ServiceError("Failed to set reminder", 500);

  revalidateTag("events");
  revalidateTag("event-reminders");
  revalidateTag(`event-${eventId}`);

  return { isReminderSet: true, reminderOffsetDays: normalizedOffset };
}
