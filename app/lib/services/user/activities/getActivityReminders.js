import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";
import { requireAuth } from "@/app/lib/services/user/requireAuth";

const getCachedReminders = unstable_cache(
  async (userId) => {
    const { data: likes, error: likesError } = await supabaseAdmin
      .from("event_likes")
      .select("event_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (likesError) throw new Error("Failed to fetch event reminders");

    const eventIds = [...new Set((likes || []).map((l) => l.event_id))];

    if (eventIds.length === 0) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    const { data: events, error: eventsError } = await supabaseAdmin
      .from("events")
      .select("id, country, city, artists, date, event_image, venue_name")
      .in("id", eventIds)
      .gte("date", todayStr);

    if (eventsError) throw new Error("Failed to fetch reminder events");

    // Preserve like-order and filter out past events
    const eventById = new Map((events || []).map((e) => [e.id, e]));
    return eventIds.map((id) => eventById.get(id)).filter(Boolean);
  },
  ["user-activity-reminders"],
  {
    revalidate: 5 * 60,
    tags: ["user-activity-reminders"],
  },
);

export async function getActivityReminders() {
  const user = await requireAuth();
  return getCachedReminders(user.id);
}
