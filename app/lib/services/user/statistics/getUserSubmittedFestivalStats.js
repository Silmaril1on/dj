import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";
import { requireAuth } from "@/app/lib/services/user/requireAuth";

const getCachedSubmittedFestival = unstable_cache(
  async (userId, submittedFestivalId) => {
    if (!submittedFestivalId) return [];

    const { data, error } = await supabaseAdmin
      .from("festivals")
      .select(
        "id, name, festival_slug, poster, country, city, capacity_total, status, created_at",
      )
      .eq("id", submittedFestivalId);

    if (error) throw new Error("Failed to fetch submitted festival profile");

    return data || [];
  },
  ["user-statistics", "submitted-festival"],
  {
    revalidate: 24 * 60 * 60,
    tags: ["user-statistics-submitted-festival"],
  },
);

export async function getUserSubmittedFestivalStats() {
  const user = await requireAuth();
  return getCachedSubmittedFestival(
    user.id,
    user.submitted_festival_id || null,
  );
}
