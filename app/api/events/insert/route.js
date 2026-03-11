import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createSupabaseServerClient } from "@/app/lib/config/supabaseServer";
import { cookies } from "next/headers";
import sharp from "sharp";

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
        let eventImageUrl = null;

        // Download, resize, and upload image if exists
        if (
          event.images &&
          event.images.length > 0 &&
          event.images[0].filename
        ) {
          try {
            console.log(`📥 Downloading image: ${event.images[0].filename}`);
            const imageResponse = await fetch(event.images[0].filename);
            const imageBuffer = await imageResponse.arrayBuffer();

            // Generate unique filename
            const filename = `event_${event.id}_${Date.now()}.jpg`;
            const filePath = `${filename}`;

            // Upload to Supabase Storage
            console.log(`📤 Uploading to Supabase: ${filePath}`);
            const { data: uploadData, error: uploadError } =
              await supabase.storage
                .from("event_images")
                .upload(filePath, imageBuffer, {
                  contentType: "image/jpeg",
                  upsert: false,
                });

            if (uploadError) {
              console.error("Upload error:", uploadError);
              throw uploadError;
            }

            // Get public URL
            const {
              data: { publicUrl },
            } = supabase.storage.from("event_images").getPublicUrl(filePath);

            eventImageUrl = publicUrl;
            console.log(`✅ Image uploaded: ${publicUrl}`);
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

        // Check if event already exists (title, plus date when available)
        let duplicateQuery = supabase
          .from("events")
          .select("id, event_name, date")
          .ilike("event_name", eventTitle || "");

        if (eventDate) {
          duplicateQuery = duplicateQuery.eq("date", eventDate);
        }

        const { data: existingEvent, error: checkError } =
          await duplicateQuery.maybeSingle();

        if (checkError) {
          console.error("Error checking for duplicate:", checkError);
        }

        if (existingEvent) {
          console.log(`⏭️ Skipping duplicate event: ${eventTitle}`);
          errors.push({
            event: eventTitle || event.id,
            error: "Event already exists in database",
          });
          continue; // Skip to next event
        }

        // Insert into events table
        const eventData = {
          user_id: user.id,
          country: country,
          city: city,
          address: event.venue?.address || "Not specified",
          location_url:
            event.venue?.location?.latitude && event.venue?.location?.longitude
              ? `https://www.google.com/maps?q=${event.venue.location.latitude},${event.venue.location.longitude}`
              : null,
          artists: artistsArray,
          promoter: event.promoters?.[0]?.name || null,
          date: event.date ? event.date.split("T")[0] : null,
          doors_open: doorsOpen,
          event_image: eventImageUrl,
          description: cleanDescription,
          links: event.contentUrl ? `https://ra.co${event.contentUrl}` : null,
          event_name: eventTitle,
          event_type: event.isFestival ? "festival" : "event",
          status: "approved",
          venue_name: event.venue?.name || null,
          minimum_age: event.minimumAge ? parseInt(event.minimumAge) : null,
        };

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
        } else {
          insertedEvents.push(insertedData);
          console.log(`✅ Inserted event: ${event.title}`);

          // Check if venue_name matches any club in clubs table
          if (eventData.venue_name) {
            try {
              const normalizedVenueName = eventData.venue_name
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

              console.log(`🔍 Checking for club match: ${normalizedVenueName}`);

              // Case-insensitive search for club by name
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

                // Insert into club_dates table
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

                const { data: clubDateInserted, error: clubDateError } =
                  await supabase
                    .from("club_dates")
                    .insert(clubDateData)
                    .select()
                    .single();

                if (clubDateError) {
                  // Check if it's a duplicate entry error
                  if (clubDateError.code === "23505") {
                    console.log(
                      `⏭️ Club date already exists for ${matchingClub.name} on ${eventData.date}`,
                    );
                  } else {
                    console.error("Error inserting club date:", clubDateError);
                  }
                } else {
                  console.log(
                    `✅ Added to club_dates for ${matchingClub.name}`,
                  );
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
              // Don't fail the event insertion if club_dates fails
            }
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
