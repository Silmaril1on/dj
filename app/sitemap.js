import { supabaseAdmin } from "@/app/lib/config/supabaseServer";

const BASE_URL = process.env.PROJECT_URL;

/**
 * Fetches slugs + last modified dates from a Supabase table.
 * Returns an array of { slug, date } objects.
 */
async function fetchEntries(table, slugCol, extraFilter) {
  try {
    let q = supabaseAdmin
      .from(table)
      .select(`${slugCol}, updated_at`)
      .not(slugCol, "is", null);

    if (extraFilter) q = extraFilter(q);

    const { data, error } = await q;

    if (error) {
      console.error(
        `[sitemap] Failed to fetch from "${table}":`,
        error.message,
      );
      return [];
    }

    return (data || [])
      .filter((row) => row[slugCol])
      .map((row) => ({
        slug: row[slugCol],
        date: row.updated_at ?? new Date().toISOString(),
      }));
  } catch (err) {
    console.error(`[sitemap] Unexpected error fetching "${table}":`, err);
    return [];
  }
}

const staticPages = [
  { url: BASE_URL, changeFrequency: "daily", priority: 1 },
  { url: `${BASE_URL}/artists`, changeFrequency: "daily", priority: 0.9 },
  { url: `${BASE_URL}/clubs`, changeFrequency: "daily", priority: 0.9 },
  { url: `${BASE_URL}/events`, changeFrequency: "daily", priority: 0.9 },
  { url: `${BASE_URL}/festivals`, changeFrequency: "weekly", priority: 0.8 },
  { url: `${BASE_URL}/news`, changeFrequency: "weekly", priority: 0.7 },
  // /ads intentionally excluded — low unique content, wastes crawl budget
].map((page) => ({ ...page, lastModified: new Date().toISOString() }));

export default async function sitemap() {
  try {
    const today = new Date().toISOString().split("T")[0];

    const [artists, clubs, festivals, events] = await Promise.all([
      fetchEntries("artists", "artist_slug", (q) => q.eq("status", "approved")),
      fetchEntries("clubs", "club_slug", (q) => q.eq("status", "approved")),
      fetchEntries("festivals", "festival_slug", (q) =>
        q.eq("status", "approved"),
      ),
      fetchEntries("events", "event_slug", (q) =>
        q.eq("status", "approved").gte("date", today),
      ),
    ]);

    const artistPages = artists.map(({ slug, date }) => ({
      url: `${BASE_URL}/artists/${slug}`,
      lastModified: date,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    const clubPages = clubs.map(({ slug, date }) => ({
      url: `${BASE_URL}/clubs/${slug}`,
      lastModified: date,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const festivalPages = festivals.map(({ slug, date }) => ({
      url: `${BASE_URL}/festivals/${slug}`,
      lastModified: date,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const eventPages = events.map(({ slug, date }) => ({
      url: `${BASE_URL}/events/${slug}`,
      lastModified: date,
      changeFrequency: "daily",
      priority: 0.6,
    }));

    return [
      ...staticPages,
      ...artistPages,
      ...clubPages,
      ...festivalPages,
      ...eventPages,
    ];
  } catch (err) {
    // Supabase down or cold-start failure — return static pages so Google
    // never gets a 500 from your sitemap endpoint
    console.error(
      "[sitemap] Critical failure, falling back to static pages:",
      err,
    );
    return staticPages;
  }
}
