import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";
import { requireAuth } from "@/app/lib/services/user/requireAuth";

const getCachedSubmittedEvents = unstable_cache(
  async (userId, submittedEventIds) => {
    const submittedIds = Array.isArray(submittedEventIds)
      ? submittedEventIds
      : [];
    const totalSubmittedEvents = submittedIds.length;

    if (totalSubmittedEvents === 0) {
      return { totalSubmittedEvents: 0, recentEvents: [] };
    }

    const { data, error } = await supabaseAdmin
      .from("events")
      .select(
        "id, event_name, promoter, image_url, created_at, city, country, date, event_slug",
      )
      .in("id", submittedIds)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) throw new Error("Failed to fetch submitted events");

    return { totalSubmittedEvents, recentEvents: data || [] };
  },
  ["user-statistics", "submitted-events"],
  {
    revalidate: 15 * 60,
    tags: ["user-statistics-submitted-events"],
  },
);

export async function getUserSubmittedEventsStats() {
  const user = await requireAuth();
  return getCachedSubmittedEvents(user.id, user.submitted_event_id || []);
}
