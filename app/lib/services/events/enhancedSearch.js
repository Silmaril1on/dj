import { getSupabaseAdminClient } from "../shared";

export async function searchEventsByArtists(artistNames) {
  const terms = artistNames.map((n) => n.trim().toLowerCase()).filter(Boolean);

  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("events")
    .select(
      "id, event_name, venue_name, date, event_slug, image_url, artists, country, city, status",
    )
    .eq("status", "approved")
    .order("date", { ascending: true });

  if (error) throw new Error(error.message);

  const filtered = (data || []).filter((event) => {
    const lowerArtists = (event.artists || []).map((a) =>
      String(a).trim().toLowerCase(),
    );

    return terms.every((term) =>
      lowerArtists.some((artist) => artist.includes(term)),
    );
  });

  return { success: true, data: filtered.slice(0, 50) };
}
