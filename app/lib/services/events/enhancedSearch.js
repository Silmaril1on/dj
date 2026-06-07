import { getSupabaseAdminClient } from "../shared";
import { getTodayDateOnlyString } from "@/app/helpers/utils";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 20;
const LINEUP_MATCH_LIMIT = 150;

const normalizeTerm = (value) => String(value).trim().toLowerCase();

const matchesAllTerms = (names, terms) => {
  const lowerNames = (names || []).map(normalizeTerm);
  return terms.every((term) =>
    lowerNames.some((name) => name.includes(term)),
  );
};

const escapeIlikePattern = (value) =>
  value.replace(/[%_\\]/g, "").replace(/,/g, "");

async function searchEventsByArtists(supabase, terms) {
  const today = getTodayDateOnlyString();

  const { data, error } = await supabase
    .from("events")
    .select(
      "id, event_name, venue_name, date, event_slug, image_url, artists, country, city, status",
    )
    .eq("status", "approved")
    .gte("date", today)
    .order("date", { ascending: true });

  if (error) throw new Error(error.message);

  return (data || [])
    .filter((event) => matchesAllTerms(event.artists || [], terms))
    .map((event) => ({
      ...event,
      type: "event",
      sortDate: event.date || null,
    }));
}

async function searchFestivalsByLineup(supabase, terms) {
  const lineupResults = await Promise.all(
    terms.map((term) =>
      supabase
        .from("festival_lineup")
        .select("festival_id, edition_id, artist_name")
        .not("artist_name", "is", null)
        .not("edition_id", "is", null)
        .ilike("artist_name", `%${escapeIlikePattern(term)}%`)
        .limit(LINEUP_MATCH_LIMIT),
    ),
  );

  const lineupError = lineupResults.find((result) => result.error)?.error;
  if (lineupError) throw new Error(lineupError.message);

  const lineupRows = lineupResults.flatMap((result) => result.data || []);
  if (!lineupRows?.length) return [];

  const grouped = new Map();
  for (const row of lineupRows) {
    const key = row.edition_id;
    if (!key) continue;
    const group = grouped.get(key) || {
      editionId: row.edition_id,
      festivalId: row.festival_id,
      artists: [],
    };
    group.artists.push(row.artist_name);
    grouped.set(key, group);
  }

  const matchedGroups = [...grouped.values()].filter((group) =>
    matchesAllTerms(group.artists, terms),
  );
  if (matchedGroups.length === 0) return [];

  const artistsByEdition = new Map(
    matchedGroups.map((group) => [
      group.editionId,
      [...new Set(group.artists.filter(Boolean))],
    ]),
  );

  const { data: editions, error: editionsError } = await supabase
    .from("festival_editions")
    .select(
      `
        id,
        festival_id,
        start_date,
        end_date,
        status,
        festivals!inner(
          id,
          name,
          festival_slug,
          image_url,
          country,
          city,
          status
        )
      `,
    )
    .in("id", matchedGroups.map((group) => group.editionId))
    .eq("status", "upcoming")
    .eq("festivals.status", "approved")
    .order("start_date", { ascending: true });

  if (editionsError) throw new Error(editionsError.message);

  return (editions || []).map((edition) => {
    const festival = edition.festivals;
    return {
      id: festival.id,
      name: festival.name,
      festival_slug: festival.festival_slug,
      image_url: festival.image_url,
      country: festival.country,
      city: festival.city,
      start_date: edition.start_date,
      end_date: edition.end_date,
      edition_id: edition.id,
      artists: artistsByEdition.get(edition.id) || [],
      type: "festival",
      sortDate: edition.start_date || null,
    };
  });
}

export async function searchLineupsByArtists(
  artistNames,
  { limit = DEFAULT_LIMIT, offset = 0 } = {},
) {
  const terms = artistNames.map((n) => n.trim().toLowerCase()).filter(Boolean);
  const pageLimit = Math.min(
    Math.max(Number(limit) || DEFAULT_LIMIT, 1),
    MAX_LIMIT,
  );
  const pageOffset = Math.max(Number(offset) || 0, 0);

  const supabase = getSupabaseAdminClient();

  const [events, festivals] = await Promise.all([
    searchEventsByArtists(supabase, terms),
    searchFestivalsByLineup(supabase, terms),
  ]);

  const data = [...events, ...festivals].sort((a, b) => {
    if (!a.sortDate && !b.sortDate) return 0;
    if (!a.sortDate) return 1;
    if (!b.sortDate) return -1;
    return a.sortDate.localeCompare(b.sortDate);
  });

  return {
    success: true,
    data: data.slice(pageOffset, pageOffset + pageLimit),
    hasMore: data.length > pageOffset + pageLimit,
    total: data.length,
  };
}
