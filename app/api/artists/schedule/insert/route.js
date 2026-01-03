import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/lib/config/supabaseServer";
import { cookies } from "next/headers";
import sharp from "sharp";

export async function POST(req) {
  try {
    const { artistId, events } = await req.json();

    if (!artistId || !events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: "Artist ID and events array are required" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);

    const insertedSchedules = [];
    const errors = [];

    for (const event of events) {
      try {
        let eventImageUrl = null;

        // Determine image source based on event type (Bandsintown or RA)
        const imageSource =
          event.artistImage ||
          (event.images && event.images.length > 0 && event.images[0].filename);

        // Download, resize, and upload image if exists
        if (imageSource) {
          try {
            console.log(`📥 Downloading image: ${imageSource}`);
            const imageResponse = await fetch(imageSource);
            const imageBuffer = await imageResponse.arrayBuffer();

            // Resize to 512x512
            console.log("✂️ Resizing image to 512x512...");
            const resizedBuffer = await sharp(Buffer.from(imageBuffer))
              .resize(512, 512, { fit: "cover" })
              .jpeg({ quality: 90 })
              .toBuffer();

            // Generate unique filename
            const filename = `${artistId}_${Date.now()}_${Math.random()
              .toString(36)
              .substring(7)}.jpg`;
            const filePath = `schedule_images/${filename}`;

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

        // Extract date and time - handle both Bandsintown and RA formats
        let date = null;
        let time = null;
        let country = null;
        let city = null;
        let clubName = null;
        let eventLink = null;
        let eventType = null;
        let eventTitle = null;

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
          artist_id: artistId,
          date: date,
          time: time,
          country: country,
          city: city,
          club_name: clubName,
          event_link: eventLink,
          event_id: null,
          status: "approved",
          event_image: eventImageUrl,
          event_type: eventType,
          event_title: eventTitle,
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
      { status: 500 }
    );
  }
}
