import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_REMINDER_OFFSETS = [3, 7, 14, 30] as const;

const REMINDER_LABELS: Record<number, string> = {
  3: "3 days",
  7: "1 week",
  14: "2 weeks",
  30: "1 month",
};

type EventRow = {
  id: string;
  event_name: string | null;
  venue_name: string | null;
  date: string;
  event_status?: string | null;
  status?: string | null;
};

type ReminderRow = {
  id: string;
  user_id: string;
  event_id: string;
  reminder_sent: boolean | null;
  reminder_offset_days: number | null;
};

type NotificationRow = {
  user_id: string;
  title: string;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
};

const toDateOnlyString = (value: Date | string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const normalizeReminderOffset = (value: number | null | undefined) => {
  if (value == null) return 3;
  const parsed = Number.parseInt(String(value), 10);
  return ALLOWED_REMINDER_OFFSETS.includes(
    parsed as (typeof ALLOWED_REMINDER_OFFSETS)[number],
  )
    ? parsed
    : 3;
};

const getDaysUntil = (todayDateOnly: string, eventDateOnly: string) => {
  const today = new Date(`${todayDateOnly}T00:00:00`);
  const eventDate = new Date(`${eventDateOnly}T00:00:00`);
  const diffMs = eventDate.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
};

serve(async (req) => {
  const runId = crypto.randomUUID();

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return new Response(
      JSON.stringify({
        success: false,
        error: `Method ${req.method} not allowed`,
        runId,
      }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    const supabaseUrl =
      Deno.env.get("SUPABASE_URL") || Deno.env.get("PROJECT_URL");
    const serviceRoleKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
      Deno.env.get("SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing Supabase environment variables",
          runId,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const todayDate = toDateOnlyString(now);

    if (!todayDate) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to compute today's date",
          runId,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { data: reminders, error: remindersError } = await supabase
      .from("event_reminders")
      .select("id, user_id, event_id, reminder_sent, reminder_offset_days")
      .or("reminder_sent.is.false,reminder_sent.is.null");

    if (remindersError) {
      throw new Error(
        `Failed to fetch event reminders: ${remindersError.message}`,
      );
    }

    const pendingReminders = (reminders || []) as ReminderRow[];

    if (pendingReminders.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          runId,
          todayDate,
          eventsMatched: 0,
          remindersMatched: 0,
          notificationsInserted: 0,
          remindersUpdated: 0,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const pendingEventIds = Array.from(
      new Set(pendingReminders.map((item) => item.event_id)),
    );

    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("id, event_name, venue_name, date, event_status, status")
      .in("id", pendingEventIds);

    if (eventsError) {
      throw new Error(`Failed to fetch events: ${eventsError.message}`);
    }

    const allReminderEvents = (events || []) as EventRow[];
    const eventById = new Map(
      allReminderEvents.map((event) => [event.id, event]),
    );

    const matchedReminders = pendingReminders.filter((reminder) => {
      const event = eventById.get(reminder.event_id);
      if (!event) return false;

      const eventDateOnly = toDateOnlyString(event.date);
      if (!eventDateOnly) return false;

      if (event.event_status && event.event_status !== "upcoming") return false;
      if (!event.event_status && event.status && event.status !== "approved")
        return false;

      const offsetDays = normalizeReminderOffset(reminder.reminder_offset_days);
      const daysUntilEvent = getDaysUntil(todayDate, eventDateOnly);
      return daysUntilEvent === offsetDays;
    });

    if (matchedReminders.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          runId,
          todayDate,
          eventsMatched: allReminderEvents.length,
          remindersMatched: 0,
          notificationsInserted: 0,
          remindersUpdated: 0,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const uniqueReminderMap = new Map<string, ReminderRow>();
    matchedReminders.forEach((item) => {
      const key = `${item.user_id}:${item.event_id}`;
      if (!uniqueReminderMap.has(key)) {
        uniqueReminderMap.set(key, item);
      }
    });

    const notifications = Array.from(uniqueReminderMap.values())
      .map((item): NotificationRow | null => {
        const event = eventById.get(item.event_id);
        if (!event) return null;

        const offsetDays = normalizeReminderOffset(item.reminder_offset_days);
        const offsetLabel = REMINDER_LABELS[offsetDays] || `${offsetDays} days`;

        const eventDisplayName =
          event.event_name?.trim() || event.venue_name?.trim() || "Your event";

        return {
          user_id: item.user_id,
          title: `Event reminder::${event.id}`,
          type: "reminder",
          message: `${eventDisplayName} is happening in ${offsetLabel} (${event.date}).`,
          read: false,
          created_at: new Date().toISOString(),
        };
      })
      .filter((item): item is NotificationRow => item !== null);

    if (notifications.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          runId,
          todayDate,
          eventsMatched: allReminderEvents.length,
          remindersMatched: matchedReminders.length,
          notificationsInserted: 0,
          remindersUpdated: 0,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { error: notificationError } = await supabase
      .from("notifications")
      .insert(notifications);

    if (notificationError) {
      throw new Error(
        `Failed to insert notifications: ${notificationError.message}`,
      );
    }

    const reminderIds = matchedReminders.map((item) => item.id);
    const { error: updateError } = await supabase
      .from("event_reminders")
      .update({ reminder_sent: true })
      .in("id", reminderIds);

    if (updateError) {
      throw new Error(
        `Failed to update reminder flags: ${updateError.message}`,
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        runId,
        todayDate,
        eventsMatched: allReminderEvents.length,
        remindersMatched: matchedReminders.length,
        notificationsInserted: notifications.length,
        remindersUpdated: reminderIds.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unexpected error",
        runId,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
