import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/lib/config/supabaseServer";
import { cookies } from "next/headers";

export async function POST(req) {
  try {
    const { artistId, events } = await req.json();

    if (!events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: "Events array is required" },
        { status: 400 },
      );
    }

    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);

    const insertedSchedules = [];
    const errors = [];

    const isUuid = (value) =>
      typeof value === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
      );

    for (const event of events) {
      try {
        // Extract date and time - handle both Bandsintown and RA formats
        let date = null;
        let time = null;
        let country = null;
        let city = null;
        let clubName = null;
        let eventLink = null;
        let eventType = null;
        let eventTitle = null;
        let eventLocation = null;
        let artistIdToUse = artistId || event.artistId || null;

        if (!artistIdToUse) {
          throw new Error("Artist ID is missing for this event");
        }

        if (!isUuid(artistIdToUse)) {
          const lookupName = event.artistName || event.name || null;

          if (!lookupName) {
            throw new Error(
              "Artist ID is not UUID and no artist name to resolve",
            );
          }

          const { data: matchedArtist, error: artistLookupError } =
            await supabase
              .from("artists")
              .select("id, name, stage_name")
              .or(`name.ilike.%${lookupName}%,stage_name.ilike.%${lookupName}%`)
              .limit(1)
              .maybeSingle();

          if (artistLookupError) {
            throw new Error(artistLookupError.message);
          }

          if (!matchedArtist?.id) {
            throw new Error(`No matching artist found for ${lookupName}`);
          }

          artistIdToUse = matchedArtist.id;
        }

        // Bandsintown format
        if (event.startsAt) {
          date = event.startsAt.split("T")[0];
          time = event.startTime
            ? event.startTime.replace(/\s*GMT[+-]?\d+/, "").trim()
            : null;

          // Parse venueCity to extract country and city
          if (event.venueCity) {
            const parts = event.venueCity.split(",").map((p) => p.trim());
            if (parts.length === 2) {
              city = parts[0];
              country = parts[1];
            } else if (parts.length === 1) {
              city = parts[0];
            }
          }

          clubName = event.venueName || null;
          eventLink = event.url || null;
          eventType = event.eventType || null;
          eventTitle = event.title || null;

          if (event.lat != null && event.lon != null) {
            eventLocation = `https://www.google.com/maps?q=${event.lat},${event.lon}`;
          }
        }
        // RA format
        else if (event.date) {
          date = event.date.split("T")[0];
          time = event.startTime || null;

          country = event.venue?.area?.country?.name || null;
          city = event.venue?.area?.name || null;

          // Handle "All" or invalid city values
          if (!city || city.toLowerCase() === "all") {
            city = "Not specified";
          }

          clubName = event.venue?.name || null;
          eventLink = event.contentUrl
            ? `https://ra.co${event.contentUrl}`
            : null;
          eventType = event.isFestival ? "festival" : "event";
          eventTitle = event.title || null;
        }

        // Insert into artist_schedule
        const scheduleData = {
          artist_id: artistIdToUse,
          date: date,
          time: time,
          country: country,
          city: city,
          club_name: clubName,
          event_link: eventLink,
          event_title: eventTitle,
          event_location: eventLocation,
        };

        console.log("💾 Inserting schedule:", scheduleData);

        const { data: insertedData, error: insertError } = await supabase
          .from("artist_schedule")
          .insert(scheduleData)
          .select()
          .single();

        if (insertError) {
          console.error("Insert error:", insertError);
          errors.push({
            event: event.title || event.url,
            error: insertError.message,
          });
        } else {
          insertedSchedules.push(insertedData);
          console.log(`✅ Inserted schedule for: ${event.title}`);
        }
      } catch (eventError) {
        console.error("Event processing error:", eventError);
        errors.push({
          event: event.title || event.url,
          error: eventError.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      inserted: insertedSchedules.length,
      total: events.length,
      data: insertedSchedules,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("❌ Schedule insert error:", error);
    return NextResponse.json(
      { error: "Failed to insert schedules", details: error.message },
      { status: 500 },
    );
  }
}
