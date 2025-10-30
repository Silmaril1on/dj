import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createSupabaseServerClient,
  getServerUser,
} from "@/app/lib/config/supabaseServer";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);

    const { user, error: userError } = await getServerUser(cookieStore);

    const { data: events, error } = await supabase
      .from("events")
      .select("*")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(7);

    if (error) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch events" },
        { status: 500 }
      );
    }

    if (!events || events.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const eventIds = events.map((e) => e.id);

    const { data: likesData } = await supabase
      .from("event_likes")
      .select("event_id, user_id")
      .in("event_id", eventIds);

    const enrichedEvents = events.map((event) => {
      const likesForEvent =
        likesData?.filter((l) => l.event_id === event.id) || [];
      const likesCount = likesForEvent.length;
      const isLiked = user
        ? likesForEvent.some((l) => l.user_id === user.id)
        : false;

      return {
        ...event,
        isLiked,
        likesCount,
      };
    });

    return NextResponse.json({ success: true, data: enrichedEvents });
  } catch (err) {
    console.error("Unexpected error in GET /api/events:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
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
        { status: 401 }
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
    const club_id = formData.get("club_id") || null;

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
      (f) => !fields[f] || fields[f].trim() === ""
    );

    if (missing.length) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields: ${missing.join(", ")}`,
        },
        { status: 400 }
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
        { status: 400 }
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
          { status: 400 }
        );
      }

      if (event_image.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: "File too large. Max 5MB allowed." },
          { status: 400 }
        );
      }

      const { error: uploadError } = await supabase.storage
        .from("event_images")
        .upload(fileName, event_image, { cacheControl: "3600", upsert: false });

      if (uploadError) {
        return NextResponse.json(
          { success: false, error: "Failed to upload image" },
          { status: 500 }
        );
      }

      const { data } = supabase.storage
        .from("event_images")
        .getPublicUrl(fileName);
      eventImageUrl = data.publicUrl;
    }

    // ---- Match club by venue_name ----
    let matchedClubId = club_id; // Use existing club_id if provided
    
    if (fields.venue_name && !club_id) {
      const { data: matchedClubs, error: clubError } = await supabase
        .from("clubs")
        .select("id, name")
        .ilike("name", fields.venue_name);

      if (clubError) {
        console.error("Error finding clubs:", clubError);
      } else if (matchedClubs && matchedClubs.length > 0) {
        // Find exact match or closest match
        const exactMatch = matchedClubs.find(
          (club) => club.name.toLowerCase() === fields.venue_name.toLowerCase()
        );
        matchedClubId = exactMatch ? exactMatch.id : matchedClubs[0].id;
        console.log("Matched club:", exactMatch || matchedClubs[0]);
      }
    }

    // ---- Insert event ----
    const eventData = {
      user_id: user.id,
      ...fields,
      artists,
      event_image: eventImageUrl,
      club_id: matchedClubId,
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
        { status: 500 }
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
          event_id: event.id,
          date: fields.date,
          time: fields.doors_open || null,
          country: fields.country,
          city: fields.city,
          club_name: fields.venue_name || null,
          event_link: fields.location_url || null,
          status: 'pending',
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
            `Successfully created ${scheduleData.length} artist schedule entries`
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

    return NextResponse.json({
      success: true,
      message: "Event created successfully",
      data: event,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
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
        { status: 401 }
      );
    }

    const supabase = await createSupabaseServerClient(cookieStore);
    const formData = await request.formData();

    const eventId = formData.get("eventId");
    if (!eventId) {
      return NextResponse.json(
        { success: false, error: "Missing eventId" },
        { status: 400 }
      );
    }

    // Build update object
    const updateFields = {};
    for (const [key, value] of formData.entries()) {
      if (key !== "eventId" && value !== undefined && value !== null) {
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
    let eventImageUrl = null;
    if (event_image instanceof File) {
      const fileExtension = event_image.name.split(".").pop();
      const fileName = `event_${eventId}_${Date.now()}.${fileExtension}`;
      if (!event_image.type.startsWith("image/")) {
        return NextResponse.json(
          { success: false, error: "Invalid file type. Only images are allowed." },
          { status: 400 }
        );
      }
      if (event_image.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: "File too large. Max 5MB allowed." },
          { status: 400 }
        );
      }
      const { error: uploadError } = await supabase.storage
        .from("event_images")
        .upload(fileName, event_image, { cacheControl: "3600", upsert: true });
      if (uploadError) {
        return NextResponse.json(
          { success: false, error: "Failed to upload image" },
          { status: 500 }
        );
      }
      const { data } = supabase.storage
        .from("event_images")
        .getPublicUrl(fileName);
      eventImageUrl = data.publicUrl;
      updateFields.event_image = eventImageUrl;
    }

    // Update the event
    const { data: updated, error: updateError } = await supabase
      .from("events")
      .update(updateFields)
      .eq("id", eventId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: "Failed to update event" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Event updated successfully",
      data: updated,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
