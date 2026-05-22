import { supabaseAdmin } from "@/app/lib/config/supabaseServer";

/**
 * Fetch pending artist_schedule entries for the artist owned by userId,
 * enriched with event_slug + creator (userName, user_avatar) via the events table.
 */
export async function getPendingSchedules(userId) {
  const { data: artist } = await supabaseAdmin
    .from("artists")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!artist) return [];

  const { data: schedules, error } = await supabaseAdmin
    .from("artist_schedule")
    .select("*")
    .eq("artist_id", artist.id)
    .eq("status", "pending")
    .order("date", { ascending: true });

  if (error) throw new Error(error.message);

  const result = schedules || [];
  const eventIds = [...new Set(result.map((s) => s.event_id).filter(Boolean))];
  if (eventIds.length === 0) return result;

  const { data: events } = await supabaseAdmin
    .from("events")
    .select("id, event_slug, user_id")
    .in("id", eventIds);

  const eventMap = {};
  const userIds = [];
  (events || []).forEach((ev) => {
    eventMap[ev.id] = ev;
    if (ev.user_id) userIds.push(ev.user_id);
  });

  const uniqueUserIds = [...new Set(userIds)];
  const userMap = {};
  if (uniqueUserIds.length > 0) {
    const { data: users } = await supabaseAdmin
      .from("users")
      .select("id, userName, user_avatar")
      .in("id", uniqueUserIds);
    (users || []).forEach((u) => {
      userMap[u.id] = u;
    });
  }

  result.forEach((s) => {
    const ev = eventMap[s.event_id];
    if (ev) {
      s.event_slug = ev.event_slug || null;
      if (ev.user_id && userMap[ev.user_id]) {
        s.creator = userMap[ev.user_id];
      }
    }
  });

  return result;
}

/**
 * Approve a pending schedule entry. Verifies the schedule belongs to an artist
 * owned by userId before updating.
 */
export async function approvePendingSchedule(id, userId) {
  const { data: schedule } = await supabaseAdmin
    .from("artist_schedule")
    .select("artist_id")
    .eq("id", id)
    .maybeSingle();

  if (!schedule) throw new Error("Not found");

  const { data: artist } = await supabaseAdmin
    .from("artists")
    .select("id")
    .eq("id", schedule.artist_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (!artist) throw new Error("Unauthorized");

  const { error } = await supabaseAdmin
    .from("artist_schedule")
    .update({ status: "approved" })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

/**
 * Decline (delete) a pending schedule entry. Verifies ownership before deleting.
 */
export async function declinePendingSchedule(id, userId) {
  const { data: schedule } = await supabaseAdmin
    .from("artist_schedule")
    .select("artist_id")
    .eq("id", id)
    .maybeSingle();

  if (!schedule) throw new Error("Not found");

  const { data: artist } = await supabaseAdmin
    .from("artists")
    .select("id")
    .eq("id", schedule.artist_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (!artist) throw new Error("Unauthorized");

  const { error } = await supabaseAdmin
    .from("artist_schedule")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}
