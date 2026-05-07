"use server";
import { getAuthenticatedContext } from "@/app/lib/services/shared";

const VALID_TYPES = ["artist", "club", "event", "festival"];
const MAX_ITEMS = 6;

const TYPE_QUERIES = {
  artist: (supabase, ids) =>
    supabase
      .from("artists")
      .select("id, name, stage_name, image_url, artist_slug")
      .in("id", ids)
      .then(({ data }) =>
        (data || []).map((item) => ({
          id: item.id,
          name: item.stage_name || item.name,
          image: item.image_url,
          href: `/artists/${item.artist_slug}`,
          type: "artist",
        })),
      ),

  club: (supabase, ids) =>
    supabase
      .from("clubs")
      .select("id, name, club_slug, image_url")
      .in("id", ids)
      .then(({ data }) =>
        (data || []).map((item) => ({
          id: item.id,
          name: item.name,
          image: item.image_url,
          href: `/clubs/${item.club_slug || item.id}`,
          type: "club",
        })),
      ),

  event: (supabase, ids) =>
    supabase
      .from("events")
      .select("id, event_name, image_url, event_slug")
      .in("id", ids)
      .then(({ data }) =>
        (data || []).map((item) => ({
          id: item.id,
          name: item.event_name,
          image: item.image_url,
          href: `/events/${item.event_slug || item.id}`,
          type: "event",
        })),
      ),

  festival: (supabase, ids) =>
    supabase
      .from("festivals")
      .select("id, name, festival_slug, image_url")
      .in("id", ids)
      .then(({ data }) =>
        (data || []).map((item) => ({
          id: item.id,
          name: item.name,
          image: item.image_url,
          href: `/festivals/${item.festival_slug || item.id}`,
          type: "festival",
        })),
      ),
};

export async function getRecentViews(cookieStore, { type } = {}) {
  const { user, supabase } = await getAuthenticatedContext(cookieStore);

  let query = supabase
    .from("recently_viewed")
    .select("*")
    .eq("user_id", user.id)
    .order("viewed_at", { ascending: false })
    .limit(MAX_ITEMS);

  if (type) {
    if (!VALID_TYPES.includes(type)) throw new Error("Invalid type");
    query = query.eq("type", type);
  }

  const { data: recentViews, error } = await query;
  if (error) throw new Error("Failed to fetch recently viewed");
  if (!recentViews?.length) return [];

  const grouped = recentViews.reduce((acc, rv) => {
    (acc[rv.type] ??= []).push(rv.item_id);
    return acc;
  }, {});

  const results = await Promise.all(
    Object.entries(grouped).map(
      ([t, ids]) => TYPE_QUERIES[t]?.(supabase, ids) ?? [],
    ),
  );

  const itemMap = new Map(results.flat().map((item) => [item.id, item]));

  return recentViews.map((rv) => itemMap.get(rv.item_id)).filter(Boolean);
}
