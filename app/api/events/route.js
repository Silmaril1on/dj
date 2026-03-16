import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import {
  createSupabaseServerClient,
  getServerUser,
} from "@/app/lib/config/supabaseServer";
import { getTodayDateOnlyString } from "@/app/helpers/utils";

const extractEventImagePath = (url) => {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const marker = "/storage/v1/object/public/event_images/";
    const idx = parsed.pathname.indexOf(marker);
    if (idx === -1) return null;
    return parsed.pathname.slice(idx + marker.length);
  } catch {
    return null;
  }
};

// GET /api/events
// Used by the home page hero to show upcoming events.
// Behaviour:
//   - only approved events with date >= today
//   - sort by closest date, then by likesCount (most interested)
//   - configurable `limit` query param (default 7)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "7", 10);
    // Fetch more rows than we will finally return so we can sort
    // by likes in-memory without missing popular events.
    const fetchLimit = Math.max(limit * 4, limit, 40);

    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);

    const { user, error: userError } = await getServerUser(cookieStore);

    // Use local date-only string to avoid UTC day-shift issues.
    const todayStr = getTodayDateOnlyString();

    // ✅ Fetch upcoming events and likes in parallel
    const [eventsResult, likesResult, remindersResult] = await Promise.all([
      supabase
        .from("events")
        .select("*")
        .eq("status", "approved")
        .gte("date", todayStr)
        .order("date", { ascending: true })
        .limit(fetchLimit),

      supabase.from("event_likes").select("event_id, user_id"),

      user?.id
        ? supabase
            .from("event_reminders")
            .select("event_id, reminder_offset_days")
            .eq("user_id", user.id)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (eventsResult.error) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch events" },
        { status: 500 },
      );
    }

    const events = eventsResult.data || [];

    if (events.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const eventIds = events.map((e) => e.id);
    const likesData = likesResult.data || [];
    const remindersData = remindersResult.data || [];

    // Build likes map for better performance
    const likesMap = {};
    const userLikesSet = new Set();
    const userRemindersSet = new Set(
      remindersData.map((item) => item.event_id),
    );
    const userReminderOffsetMap = new Map(
      remindersData.map((item) => [item.event_id, item.reminder_offset_days]),
    );

    likesData.forEach((like) => {
      if (eventIds.includes(like.event_id)) {
        likesMap[like.event_id] = (likesMap[like.event_id] || 0) + 1;
        if (user?.id && like.user_id === user.id) {
          userLikesSet.add(like.event_id);
        }
      }
    });

    const enrichedEvents = events.map((event) => ({
      ...event,
      likesCount: likesMap[event.id] || 0,
      isLiked: userLikesSet.has(event.id),
      isReminderSet: userRemindersSet.has(event.id),
      reminderOffsetDays: userReminderOffsetMap.get(event.id) || null,
    }));

    // Sort by closest date first, then by popularity (likesCount desc)
    enrichedEvents.sort((a, b) => {
      const dateA = a.date ? new Date(a.date) : new Date(8640000000000000);
      const dateB = b.date ? new Date(b.date) : new Date(8640000000000000);
      const diff = dateA - dateB;
      if (diff !== 0) return diff;
      return (b.likesCount || 0) - (a.likesCount || 0);
    });

    const limitedEvents = enrichedEvents.slice(0, limit);

    return NextResponse.json({ success: true, data: limitedEvents });
  } catch (err) {
    console.error("Unexpected error in GET /api/events:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const { user, error: userError } = await getServerUser(cookieStore);

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "User not authenticated" },
        { status: 401 },
      );
    }

    const supabase = await createSupabaseServerClient(cookieStore);
    const formData = await request.formData();

    // ---- Extract fields ----
    const fields = {
      event_name: formData.get("event_name"),
      venue_name: formData.get("venue_name"),
      event_type: formData.get("event_type"),
      country: formData.get("country"),
      city: formData.get("city"),
      address: formData.get("address"),
      location_url: formData.get("location_url"),
      promoter: formData.get("promoter"),
      date: formData.get("date"),
      doors_open: formData.get("doors_open"),
      description: formData.get("description"),
      links: formData.get("links"),
    };
    const event_image = formData.get("event_image");

    // ---- Validate required fields ----
    const required = [
      "event_name",
      "event_type",
      "country",
      "city",
      "date",
      "promoter",
    ];
    const missing = required.filter(
      (f) => !fields[f] || fields[f].trim() === "",
    );

    if (missing.length) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields: ${missing.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // ---- Parse artists ----
    let artists = [];
    try {
      const artistEntries = formData.getAll("artists");
      const jsonEntry = artistEntries.find((e) => {
        try {
          return typeof e === "string" && JSON.parse(e);
        } catch {
          return false;
        }
      });
      artists = jsonEntry
        ? JSON.parse(jsonEntry)
        : artistEntries.filter((e) => e?.trim());
    } catch {
      artists = [];
    }

    if (!artists.length) {
      return NextResponse.json(
        { success: false, error: "At least one artist is required" },
        { status: 400 },
      );
    }

    // ---- Handle image upload ----
    let eventImageUrl = null;
    if (event_image instanceof File) {
      const fileExtension = event_image.name.split(".").pop();
      const fileName = `${fields.event_name
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "")}_${Date.now()}.${fileExtension}`;

      if (!event_image.type.startsWith("image/")) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid file type. Only images are allowed.",
          },
          { status: 400 },
        );
      }

      if (event_image.size > 1 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: "File too large. Max 1MB allowed." },
          { status: 400 },
        );
      }

      const { error: uploadError } = await supabase.storage
        .from("event_images")
        .upload(fileName, event_image, { cacheControl: "3600", upsert: false });

      if (uploadError) {
        return NextResponse.json(
          { success: false, error: "Failed to upload image" },
          { status: 500 },
        );
      }

      const { data } = supabase.storage
        .from("event_images")
        .getPublicUrl(fileName);
      eventImageUrl = data.publicUrl;
    }

    // ---- Insert event ----
    const eventData = {
      user_id: user.id,
      ...fields,
      artists,
      event_image: eventImageUrl,
      created_at: new Date().toISOString(),
    };

    const { data: event, error: insertError } = await supabase
      .from("events")
      .insert(eventData)
      .select()
      .single();

    if (insertError) {
      console.error("Event insert error:", insertError);
      return NextResponse.json(
        { success: false, error: "Failed to create event" },
        { status: 500 },
      );
    }

    // ---- Create artist_schedule entries for each artist in the event ----
    if (artists && artists.length > 0) {
      // Find matching artists in the database by name or stage_name
      const { data: matchedArtists, error: artistError } = await supabase
        .from("artists")
        .select("id, name, stage_name")
        .or(
          artists
            .map(
              (artistName) =>
                `name.ilike.${artistName},stage_name.ilike.${artistName}`,
            )
            .join(","),
        );

      if (artistError) {
        console.error("Error finding artists:", artistError);
      } else if (matchedArtists && matchedArtists.length > 0) {
        console.log("Matched artists:", matchedArtists);

        // Prepare artist_schedule entries with pending status
        const scheduleEntries = matchedArtists.map((artist) => ({
          artist_id: artist.id,
          event_id: event.id,
          date: fields.date,
          time: fields.doors_open || null,
          country: fields.country,
          city: fields.city,
          club_name: fields.venue_name || null,
          event_link: fields.location_url || null,
          status: "pending",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        console.log("Inserting schedule entries:", scheduleEntries);

        // Insert into artist_schedule
        const { data: scheduleData, error: scheduleError } = await supabase
          .from("artist_schedule")
          .insert(scheduleEntries)
          .select();

        if (scheduleError) {
          console.error("Error inserting artist schedules:", scheduleError);
          // Don't fail the entire event creation if schedule insert fails
        } else {
          console.log(
            `Successfully created ${scheduleData.length} artist schedule entries`,
          );
        }
      } else {
        console.log("No matching artists found in database");
      }
    }

    // ---- Update user's submitted_event_id ----
    const { data: userData } = await supabase
      .from("users")
      .select("submitted_event_id")
      .eq("id", user.id)
      .single();

    if (userData) {
      const updatedIds = [...(userData.submitted_event_id || []), event.id];
      await supabase
        .from("users")
        .update({ submitted_event_id: updatedIds })
        .eq("id", user.id);
    }

    revalidateTag("events");
    revalidateTag(`user-statistics-${user.id}`);
    revalidateTag(`user-statistics-submitted-events-${user.id}`);
    revalidateTag("user-statistics-submitted-events");

    return NextResponse.json({
      success: true,
      message: "Event created successfully",
      data: event,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request) {
  try {
    const cookieStore = await cookies();
    const { user, error: userError } = await getServerUser(cookieStore);

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "User not authenticated" },
        { status: 401 },
      );
    }

    const supabase = await createSupabaseServerClient(cookieStore);
    const formData = await request.formData();

    const eventId = formData.get("eventId");
    console.log(
      "📝 PATCH /api/events - eventId:",
      eventId,
      "Type:",
      typeof eventId,
    );

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: "Missing eventId" },
        { status: 400 },
      );
    }

    // Check if event exists first (try both as string and number for UUID compatibility)
    const { data: existingEvent, error: checkError } = await supabase
      .from("events")
      .select("id, event_name, user_id, event_image")
      .eq("id", eventId)
      .maybeSingle();

    console.log("🔍 Existing event check:", {
      eventId,
      existingEvent: existingEvent
        ? { id: existingEvent.id, name: existingEvent.event_name }
        : null,
      checkError,
    });

    if (checkError) {
      console.error("❌ Error checking event:", checkError);
      return NextResponse.json(
        {
          success: false,
          error: "Error checking event",
          details: checkError.message,
        },
        { status: 500 },
      );
    }

    if (!existingEvent) {
      console.error("❌ Event not found with ID:", eventId);
      return NextResponse.json(
        { success: false, error: `Event with ID ${eventId} not found` },
        { status: 404 },
      );
    }

    // Build update object
    const updateFields = {};
    for (const [key, value] of formData.entries()) {
      if (
        key !== "eventId" &&
        key !== "club_id" &&
        key !== "event_image" &&
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        // Handle arrays (artists, links, etc) if needed
        if (["artists", "links"].includes(key)) {
          try {
            updateFields[key] = JSON.parse(value);
          } catch {
            updateFields[key] = value;
          }
        } else {
          updateFields[key] = value;
        }
      }
    }

    // Handle image upload if a new file is provided
    const event_image = formData.get("event_image");
    if (event_image) {
      if (event_image instanceof File) {
        const oldImagePath = extractEventImagePath(existingEvent?.event_image);

        if (oldImagePath) {
          const { error: removeError } = await supabase.storage
            .from("event_images")
            .remove([oldImagePath]);

          if (removeError) {
            console.error("Failed to remove old event image:", removeError);
          }
        }

        // Handle file upload
        const fileExtension = event_image.name.split(".").pop();
        const fileName = `event_${eventId}_${Date.now()}.${fileExtension}`;
        if (!event_image.type.startsWith("image/")) {
          return NextResponse.json(
            {
              success: false,
              error: "Invalid file type. Only images are allowed.",
            },
            { status: 400 },
          );
        }
        if (event_image.size > 1 * 1024 * 1024) {
          return NextResponse.json(
            { success: false, error: "File too large. Max 1MB allowed." },
            { status: 400 },
          );
        }
        const { error: uploadError } = await supabase.storage
          .from("event_images")
          .upload(fileName, event_image, {
            cacheControl: "3600",
            upsert: true,
          });
        if (uploadError) {
          return NextResponse.json(
            { success: false, error: "Failed to upload image" },
            { status: 500 },
          );
        }
        const { data } = supabase.storage
          .from("event_images")
          .getPublicUrl(fileName);
        updateFields.event_image = data.publicUrl;
      } else if (typeof event_image === "string" && event_image.trim() !== "") {
        // Handle URL string
        updateFields.event_image = event_image;
      }
    }

    // Update the event
    console.log("📤 Updating event with fields:", updateFields);

    const { data: updated, error: updateError } = await supabase
      .from("events")
      .update(updateFields)
      .eq("id", eventId)
      .select()
      .single();

    if (updateError) {
      console.error("❌ Error updating event:", updateError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update event",
          details: updateError.message,
        },
        { status: 500 },
      );
    }

    console.log("✅ Event updated successfully:", updated.id);

    revalidateTag("events");
    revalidateTag(`user-statistics-${user.id}`);
    revalidateTag(`user-statistics-submitted-events-${user.id}`);
    revalidateTag("user-statistics-submitted-events");

    return NextResponse.json({
      success: true,
      message: "Event updated successfully",
      data: updated,
    });
  } catch (err) {
    console.error("❌ PATCH /api/events error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error", details: err.message },
      { status: 500 },
    );
  }
}
