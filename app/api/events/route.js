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

    // Get current user
    const { user, error: userError } = await getServerUser(cookieStore);

    console.log("////////////////////", user);

    // Fetch events
    const { data: events, error } = await supabase
      .from("events")
      .select("*")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(15);

    if (error) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch events" },
        { status: 500 }
      );
    }

    if (!events || events.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Fetch likes for all events in one go
    const eventIds = events.map((e) => e.id);

    const { data: likesData } = await supabase
      .from("event_likes")
      .select("event_id, user_id")
      .in("event_id", eventIds);

    // Build enriched events
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
        console.error("Upload error:", uploadError);
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
      console.error("Insert error:", insertError);
      return NextResponse.json(
        { success: false, error: "Failed to create event" },
        { status: 500 }
      );
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
    console.error("Unexpected error in POST:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
