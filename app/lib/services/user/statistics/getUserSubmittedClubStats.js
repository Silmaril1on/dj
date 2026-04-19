import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/app/lib/config/supabaseServer";
import { requireAuth } from "@/app/lib/services/user/requireAuth";

const getCachedSubmittedClub = unstable_cache(
  async (userId, submittedClubId) => {
    if (!submittedClubId) return [];

    const { data, error } = await supabaseAdmin
      .from("clubs")
      .select(
        "id, name, country, city, capacity, image_url, status, created_at, description",
      )
      .eq("id", submittedClubId);

    if (error) throw new Error("Failed to fetch submitted club profile");

    return data || [];
  },
  ["user-statistics", "submitted-club"],
  {
    revalidate: 24 * 60 * 60,
    tags: ["user-statistics-submitted-club"],
  },
);

export async function getUserSubmittedClubStats() {
  const user = await requireAuth();
  return getCachedSubmittedClub(user.id, user.submitted_club_id || null);
}
