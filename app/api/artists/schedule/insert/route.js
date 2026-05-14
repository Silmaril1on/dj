import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/lib/config/supabaseServer";
import { getSupabaseAdminClient } from "@/app/lib/services/shared";
import { cookies } from "next/headers";

/**
 * POST /api/artists/schedule/insert
 *
 * Accepts an array of RA-format event objects, finds any lineup artists that
 * exist in our artists table (matched by name or stage_name), and inserts rows
 * into artist_schedule for each match.
 *
 * Called from the RaEvents admin panel.  When events have already been inserted
 * via /api/events/insert the schedules are created there with a proper internal
 * event_link; this standalone route is useful for back-filling schedules or for
 * calling before the events insert (event_link will use the RA URL in that case).
 */
export async function POST(req) {
  try {
    const { events } = await req.json();

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: "events array is required" },
        { status: 400 },
      );
    }

    // Auth check via user client
    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use admin client for lookups and inserts to bypass RLS restrictions.
    const admin = getSupabaseAdminClient();

    const inserted = [];
    const skipped = [];
    const failed = [];

    for (const event of events) {
      const eventDate = event.date ? event.date.split("T")[0] : null;
      if (!eventDate) {
        skipped.push({ event: event.title ?? event.id, reason: "No date" });
        continue;
      }

      // Build shared schedule fields from the RA event object
      let doorsOpen = null;
      if (event.startTime) {
        const m = event.startTime.match(/T(\d{2}:\d{2})/);
        doorsOpen = m ? m[1] : null;
      }

      const country = event.venue?.area?.country?.name || "Not specified";
      let city = event.venue?.area?.name || "Not specified";
      if (!city || city.toLowerCase() === "all") city = "Not specified";

      const venueName = event.venue?.name || "Not specified";
      const locationUrl =
        event.venue?.location?.latitude && event.venue?.location?.longitude
          ? `https://www.google.com/maps?q=${event.venue.location.latitude},${event.venue.location.longitude}`
          : null;

      const eventTitle =
        typeof event.title === "string"
          ? event.title.replace(/\s+/g, " ").trim()
          : null;

      const eventType = event.isFestival ? "festival" : "event";

      // Use RA link as the event_link placeholder — will be overwritten with
      // the internal page URL if the event is later inserted via /api/events/insert.
      const eventLink = event.contentUrl
        ? `https://ra.co${event.contentUrl}`
        : null;

      for (const artistEntry of event.artists || []) {
        const artistName = artistEntry.name?.trim();
        if (!artistName) continue;

        try {
          // Two-step lookup — avoids OR-filter issues with special characters.
          let artistId = null;

          const { data: nameMatches } = await admin
            .from("artists")
            .select("id, name")
            .ilike("name", artistName)
            .limit(1);
          artistId = nameMatches?.[0]?.id ?? null;

          if (!artistId) {
            const { data: stageMatches } = await admin
              .from("artists")
              .select("id, name")
              .ilike("stage_name", artistName)
              .limit(1);
            artistId = stageMatches?.[0]?.id ?? null;
          }

          if (!artistId) {
            skipped.push({ artist: artistName, reason: "Not in artists table" });
            continue;
          }

          // Skip duplicates (same artist, same date)
          const { data: existing } = await admin
            .from("artist_schedule")
            .select("id")
            .eq("artist_id", artistId)
            .eq("date", eventDate)
            .maybeSingle();

          if (existing) {
            skipped.push({
              artist: artistName,
              date: eventDate,
              reason: "Duplicate",
            });
            continue;
          }

          const { error: insertErr } = await admin
            .from("artist_schedule")
            .insert({
              artist_id: artistId,
              date: eventDate,
              time: doorsOpen || "TBA",
              country,
              city,
              club_name: venueName,
              event_link: eventLink,
              event_title: eventTitle,
              event_location: locationUrl,
              event_status: "upcoming",
              event_type: eventType,
            });

          if (insertErr) {
            failed.push({ artist: artistName, error: insertErr.message });
          } else {
            inserted.push({
              artist: artistName,
              event: eventTitle,
              date: eventDate,
            });
          }
        } catch (err) {
          failed.push({ artist: artistName, error: err.message });
        }
      }
    }

    return NextResponse.json({
      success: true,
      inserted: inserted.length,
      skipped: skipped.length,
      failed: failed.length,
      details: { inserted, skipped, failed },
    });
  } catch (err) {
    console.error("Artist schedule insert error:", err);
    return NextResponse.json(
      { error: "Failed to insert artist schedules", details: err.message },
      { status: 500 },
    );
  }
}
