import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";
import { requireAuth } from "@/app/lib/services/user/requireAuth";

export async function getActivityReminders() {
  const user = await requireAuth();
  // Cache key includes userId so different users never share cached data
  return unstable_cache(
    async (uid) => {
      const { data: reminders, error: remindersError } = await supabaseAdmin
        .from("event_reminders")
        .select("event_id, created_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });

      if (remindersError) throw new Error("Failed to fetch event reminders");

      const eventIds = [...new Set((reminders || []).map((r) => r.event_id))];

      if (eventIds.length === 0) return [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split("T")[0];

      const { data: events, error: eventsError } = await supabaseAdmin
        .from("events")
        .select(
          "id, event_slug, country, city, artists, date, image_url, venue_name",
        )
        .in("id", eventIds)
        .gte("date", todayStr);

      if (eventsError) throw new Error("Failed to fetch reminder events");

      const eventById = new Map((events || []).map((e) => [e.id, e]));
      return eventIds.map((id) => eventById.get(id)).filter(Boolean);
    },
    [`user-activity-reminders-${user.id}`],
    {
      revalidate: 30 * 60,
      tags: ["user-activity-reminders", `user-reminders-${user.id}`],
    },
  )(user.id);
}
