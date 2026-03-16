import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";
import { requireAuth } from "@/app/lib/services/user/requireAuth";

const getCachedBookingStats = unstable_cache(
  async (userId) => {
    const { data: bookings, error } = await supabaseAdmin
      .from("booking_requests")
      .select("response")
      .eq("receiver_id", userId);

    if (error) throw new Error("Failed to fetch booking statistics");

    const confirmed =
      bookings?.filter((b) => b.response === "confirmed").length || 0;
    const declined =
      bookings?.filter((b) => b.response === "declined").length || 0;
    const pending =
      bookings?.filter((b) => b.response === null || b.response === "pending")
        .length || 0;
    const total = bookings?.length || 0;

    return { stats: { total, confirmed, declined, pending } };
  },
  ["user-statistics", "bookings"],
  {
    revalidate: 15 * 60,
    tags: ["user-statistics-bookings"],
  },
);

export async function getUserBookingsStats() {
  const user = await requireAuth();
  return getCachedBookingStats(user.id);
}
