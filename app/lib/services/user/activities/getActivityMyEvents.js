import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";
import { requireAuth } from "@/app/lib/services/user/requireAuth";

const getCachedMyEvents = unstable_cache(
  async (userId, submittedEventIds) => {
    const ids = Array.isArray(submittedEventIds) ? submittedEventIds : [];

    if (ids.length === 0) {
      return { allEvents: [], total: 0 };
    }

    const { data, error } = await supabaseAdmin
      .from("events")
      .select("*")
      .in("id", ids)
      .order("created_at", { ascending: false });

    if (error) throw new Error("Failed to fetch submitted events");

    return { allEvents: data || [], total: ids.length };
  },
  ["user-activity-my-events"],
  {
    revalidate: 5 * 60,
    tags: ["user-activity-my-events"],
  },
);

export async function getActivityMyEvents() {
  const user = await requireAuth();
  return getCachedMyEvents(user.id, user.submitted_event_id || []);
}
