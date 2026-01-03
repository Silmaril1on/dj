import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/lib/config/supabaseServer";
import { cookies } from "next/headers";
import sharp from "sharp";

export async function POST(req) {
  try {
    const { events } = await req.json();

    if (!events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: "Events array is required" },
        { status: 400 }
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
        { status: 401 }
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

            // Resize to 720x720
            console.log("✂️ Resizing image to 720x720...");
            const resizedBuffer = await sharp(Buffer.from(imageBuffer))
              .resize(720, 720, { fit: "cover" })
              .jpeg({ quality: 90 })
              .toBuffer();

            // Generate unique filename
            const filename = `event_${event.id}_${Date.now()}.jpg`;
            const filePath = `${filename}`;

            // Upload to Supabase Storage
            console.log(`📤 Uploading to Supabase: ${filePath}`);
            const { data: uploadData, error: uploadError } =
              await supabase.storage
                .from("event_images")
                .upload(filePath, resizedBuffer, {
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
          event_name: event.title || null,
          event_type: event.isFestival ? "festival" : "event",
          status: "approved",
          venue_name: event.venue?.name || null,
          club_id: null,
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

          // ---- Create artist_schedule entries for matching artists ----
          if (artistsArray && artistsArray.length > 0) {
            // Find matching artists in the database by name or stage_name
            const { data: matchedArtists, error: artistError } = await supabase
              .from("artists")
              .select("id, name, stage_name")
              .or(
                artistsArray
                  .map(
                    (artistName) =>
                      `name.ilike.${artistName},stage_name.ilike.${artistName}`
                  )
                  .join(",")
              );

            if (artistError) {
              console.error("Error finding artists:", artistError);
            } else if (matchedArtists && matchedArtists.length > 0) {
              console.log("Matched artists:", matchedArtists);

              // Prepare artist_schedule entries with pending status
              const scheduleEntries = matchedArtists.map((artist) => ({
                artist_id: artist.id,
                event_id: insertedData.id,
                date: eventData.date,
                time: doorsOpen,
                country: country,
                city: city,
                club_name: eventData.venue_name,
                event_link: eventData.links,
                event_title: eventData.event_name,
                event_type: eventData.event_type,
                event_image: eventImageUrl,
                status: "approved",
              }));

              console.log("Inserting schedule entries:", scheduleEntries);

              // Insert into artist_schedule
              const { data: scheduleData, error: scheduleError } =
                await supabase
                  .from("artist_schedule")
                  .insert(scheduleEntries)
                  .select();

              if (scheduleError) {
                console.error(
                  "Error inserting artist schedules:",
                  scheduleError
                );
              } else {
                console.log(
                  `Successfully created ${scheduleData.length} artist schedule entries`
                );
              }
            } else {
              console.log("No matching artists found in database");
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
      { status: 500 }
    );
  }
}
