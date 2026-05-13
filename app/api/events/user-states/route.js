import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getSupabaseServerClient,
  getAuthenticatedContext,
} from "@/app/lib/services/shared";

/**
 * GET /api/events/user-states?eventIds=id1,id2,...
 *
 * Returns likes counts + user-specific like/reminder state for multiple events
 * in 3 queries instead of 2 per event.
 *
 * Response shape:
 * {
 *   states: {
 *     [eventId]: { likesCount, isLiked, isReminderSet, reminderOffsetDays }
 *   }
 * }
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const raw = searchParams.get("eventIds") || "";
    const eventIds = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (eventIds.length === 0) {
      return NextResponse.json({ states: {} });
    }

    const cookieStore = await cookies();
    const supabase = await getSupabaseServerClient(cookieStore);

    // 1) Total likes count per event (all users)
    const { data: allLikes, error: likesError } = await supabase
      .from("event_likes")
      .select("event_id")
      .in("event_id", eventIds);

    if (likesError) {
      return NextResponse.json(
        { error: "Failed to fetch likes" },
        { status: 500 },
      );
    }

    // Count per event in JS
    const likesCounts = {};
    for (const row of allLikes || []) {
      likesCounts[row.event_id] = (likesCounts[row.event_id] || 0) + 1;
    }

    // Build default states
    const states = {};
    for (const id of eventIds) {
      states[id] = {
        likesCount: likesCounts[id] || 0,
        isLiked: false,
        isReminderSet: false,
        reminderOffsetDays: null,
      };
    }

    // 2 & 3) User-specific data — only if authenticated
    try {
      const { user } = await getAuthenticatedContext(cookieStore);

      const [userLikesResult, userRemindersResult] = await Promise.all([
        supabase
          .from("event_likes")
          .select("event_id")
          .eq("user_id", user.id)
          .in("event_id", eventIds),
        supabase
          .from("event_reminders")
          .select("event_id, reminder_offset_days")
          .eq("user_id", user.id)
          .in("event_id", eventIds),
      ]);

      for (const row of userLikesResult.data || []) {
        if (states[row.event_id]) states[row.event_id].isLiked = true;
      }

      for (const row of userRemindersResult.data || []) {
        if (states[row.event_id]) {
          states[row.event_id].isReminderSet = true;
          states[row.event_id].reminderOffsetDays =
            row.reminder_offset_days ?? null;
        }
      }
    } catch {
      // Unauthenticated — user fields stay false/null
    }

    return NextResponse.json({ states });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
