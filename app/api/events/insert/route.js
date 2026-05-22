import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createSupabaseServerClient } from "@/app/lib/config/supabaseServer";
import { cookies } from "next/headers";
import { processAndUploadRemoteImage } from "@/app/lib/services/imageProcessing";

export async function POST(req) {
  try {
    const { events } = await req.json();

    if (!events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: "Events array is required" },
        { status: 400 },
      );
    }

    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "You must be logged in to insert events" },
        { status: 401 },
      );
    }

    const insertedEvents = [];
    const errors = [];

    for (const event of events) {
      try {
        let eventImageUrls = null;

        // Download, process into sm/md/lg, and upload all 3 variants
        if (
          event.images &&
          event.images.length > 0 &&
          event.images[0].filename
        ) {
          try {
            console.log(`📥 Downloading image: ${event.images[0].filename}`);
            const baseName = `event_${event.id}_${Date.now()}`;
            eventImageUrls = await processAndUploadRemoteImage(
              event.images[0].filename,
              supabase,
              "event_images",
              baseName,
            );
            console.log(
              `✅ Image variants uploaded for event ${event.id}:`,
              eventImageUrls
                ? Object.fromEntries(
                    Object.entries(eventImageUrls).map(([k, v]) => [k, v]),
                  )
                : null,
            );
          } catch (imageError) {
            console.error("Image processing error:", imageError);
            // Continue without image if processing fails
          }
        }

        // Extract artists names from artists array
        const artistsArray = event.artists?.map((artist) => artist.name) || [];

        // Extract country and city from venue.area
        const country = event.venue?.area?.country?.name || null;
        let city = event.venue?.area?.name || null;

        // Handle "All" or invalid city values
        if (!city || city.toLowerCase() === "all") {
          city = "Not specified";
        }

        // Extract time only from startTime (e.g., "2026-03-19T12:00:00.000" -> "12:00")
        let doorsOpen = null;
        if (event.startTime) {
          const timeMatch = event.startTime.match(/T(\d{2}:\d{2})/);
          doorsOpen = timeMatch ? timeMatch[1] : null;
        }

        // Clean description - remove \n characters
        const cleanDescription = event.content
          ? event.content.replace(/\\n/g, " ").replace(/\n/g, " ").trim()
          : null;

        const eventTitle =
          typeof event.title === "string"
            ? event.title.replace(/\s+/g, " ").trim()
            : null;
        const eventDate = event.date ? event.date.split("T")[0] : null;
        const venueNameRaw = event.venue?.name || null;

        // Check duplicates by venue_name + event_name + date (all 3 must match)
        let duplicateQuery = supabase
          .from("events")
          .select("id, event_name, date, event_slug, links")
          .ilike("event_name", eventTitle || "");

        if (eventDate) duplicateQuery = duplicateQuery.eq("date", eventDate);
        if (venueNameRaw)
          duplicateQuery = duplicateQuery.ilike("venue_name", venueNameRaw);

        const { data: existingEvent, error: checkError } =
          await duplicateQuery.maybeSingle();

        if (checkError) {
          console.error("Error checking for duplicate:", checkError);
        }

        // Build event data upfront — needed for schedule insertion in both branches
        const raLink = event.contentUrl
          ? `https://ra.co${event.contentUrl}`
          : null;
        const locationUrl =
          event.venue?.location?.latitude && event.venue?.location?.longitude
            ? `https://www.google.com/maps?q=${event.venue.location.latitude},${event.venue.location.longitude}`
            : null;

        const eventData = {
          user_id: user.id,
          country: country,
          city: city,
          address: event.venue?.address || "Not specified",
          location_url: locationUrl,
          artists: artistsArray,
          promoter: event.promoters?.[0]?.name || null,
          date: eventDate,
          doors_open: doorsOpen,
          image_url: eventImageUrls,
          description: cleanDescription,
          links: null,
          event_name: eventTitle,
          event_type: event.isFestival ? "festival" : "event",
          status: "approved",
          venue_name: venueNameRaw,
          minimum_age: event.minimumAge ? parseInt(event.minimumAge) : null,
        };

        // Resolved after insert or from existing record — used for schedule rows
        let eventPageLink = raLink;

        if (existingEvent) {
          console.log(`⏭️ Skipping duplicate event: ${eventTitle}`);
          errors.push({
            event: eventTitle || event.id,
            error: "Event already exists in database",
          });
          eventPageLink = existingEvent.event_slug
            ? `https://soundfolio.net/events/${existingEvent.event_slug}`
            : existingEvent.links || raLink;
        } else {
          console.log("💾 Inserting event:", eventData);

          const { data: insertedData, error: insertError } = await supabase
            .from("events")
            .insert(eventData)
            .select()
            .single();

          if (insertError) {
            console.error("Insert error:", insertError);
            errors.push({
              event: event.title || event.id,
              error: insertError.message,
            });
            continue; // No valid event record — skip schedules
          }

          insertedEvents.push(insertedData);
          console.log(`✅ Inserted event: ${event.title}`);
          eventPageLink = insertedData.event_slug
            ? `https://soundfolio.net/events/${insertedData.event_slug}`
            : raLink;

          // Club dates (only for newly inserted events)
          if (eventData.venue_name) {
            try {
              const normalizedVenueName = eventData.venue_name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

              console.log(`🔍 Checking for club match: ${normalizedVenueName}`);

              const { data: matchingClub, error: clubError } = await supabase
                .from("clubs")
                .select("id, name")
                .ilike("name", normalizedVenueName)
                .maybeSingle();

              if (clubError) {
                console.error("Error checking for club:", clubError);
              } else if (matchingClub) {
                console.log(
                  `🎯 Found matching club: ${matchingClub.name} (ID: ${matchingClub.id})`,
                );

                const { data: existingClubDate } = await supabase
                  .from("club_dates")
                  .select("id")
                  .eq("club_id", matchingClub.id)
                  .eq("date", eventData.date)
                  .maybeSingle();

                if (existingClubDate) {
                  console.log(
                    `⏭️ Club date already exists for ${matchingClub.name} on ${eventData.date}`,
                  );
                } else {
                  const clubDateData = {
                    club_id: matchingClub.id,
                    date: eventData.date,
                    time: eventData.doors_open,
                    event_link: eventData.links,
                    event_title: eventData.event_name,
                    lineup: artistsArray,
                    status: "approved",
                    minimum_age: eventData.minimum_age,
                  };

                  console.log("💾 Inserting to club_dates:", clubDateData);

                  const { error: clubDateError } = await supabase
                    .from("club_dates")
                    .insert(clubDateData);

                  if (clubDateError) {
                    console.error("Error inserting club date:", clubDateError);
                  } else {
                    console.log(
                      `✅ Added to club_dates for ${matchingClub.name}`,
                    );
                  }
                }
              } else {
                console.log(
                  `ℹ️ No matching club found for: ${eventData.venue_name}`,
                );
              }
            } catch (clubError) {
              console.error(
                "Error processing club_dates insertion:",
                clubError,
              );
            }
          }
        }

        // --- Artist schedule insertion ---
        // Runs for BOTH new and duplicate events so lineup artists are always
        // linked even when the event already existed in the DB.
        for (const artistEntry of event.artists || []) {
          const artistName = artistEntry.name?.trim();
          if (!artistName) continue;

          try {
            let artistId = null;

            const { data: nameMatches } = await supabase
              .from("artists")
              .select("id")
              .ilike("name", artistName)
              .limit(1);
            artistId = nameMatches?.[0]?.id ?? null;

            if (!artistId) {
              const { data: stageMatches } = await supabase
                .from("artists")
                .select("id")
                .ilike("stage_name", artistName)
                .limit(1);
              artistId = stageMatches?.[0]?.id ?? null;
            }

            if (!artistId) continue;

            // Duplicate check: artist + date + event title
            // (date-only check was too broad — an artist can play two events on the same day)
            const { data: existingSched } = await supabase
              .from("artist_schedule")
              .select("id")
              .eq("artist_id", artistId)
              .eq("date", eventData.date)
              .ilike("event_title", eventData.event_name || "")
              .maybeSingle();

            if (existingSched) {
              console.log(
                `⏭️ Schedule already exists for ${artistName} — ${eventData.event_name} on ${eventData.date}`,
              );
              continue;
            }

            await supabase.from("artist_schedule").insert({
              artist_id: artistId,
              date: eventData.date,
              time: eventData.doors_open || "TBA",
              country: eventData.country || "Not specified",
              city: eventData.city || "Not specified",
              club_name: eventData.venue_name || "Not specified",
              event_link: eventPageLink,
              event_title: eventData.event_name,
              event_location: eventData.location_url,
              event_status: "upcoming",
              event_type: eventData.event_type,
              status: "approved",
            });

            console.log(`✅ Added schedule for artist: ${artistName}`);
          } catch (schedErr) {
            console.error(
              `Error inserting schedule for ${artistName}:`,
              schedErr,
            );
          }
        }
      } catch (eventError) {
        console.error("Event processing error:", eventError);
        errors.push({
          event: event.title || event.id,
          error: eventError.message,
        });
      }
    }

    if (insertedEvents.length > 0) {
      revalidateTag("events");
      revalidateTag("club_dates");
    }

    return NextResponse.json({
      success: true,
      inserted: insertedEvents.length,
      total: events.length,
      data: insertedEvents,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("❌ Events insert error:", error);
    return NextResponse.json(
      { error: "Failed to insert events", details: error.message },
      { status: 500 },
    );
  }
}
