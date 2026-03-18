import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerUser } from "@/app/lib/config/supabaseServer";
import {
  getArtistSchedules,
  createArtistSchedules,
  updateArtistSchedule,
  deleteArtistSchedule,
} from "@/app/lib/services/artists/artistSchedule";

export async function GET(request) {
  try {
    const artistId = new URL(request.url).searchParams.get("artistId");

    if (!artistId) {
      return NextResponse.json(
        { error: "Artist ID is required" },
        { status: 400 },
      );
    }

    const data = await getArtistSchedules(artistId);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Artist schedule GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedule" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const artistId = body?.artistId;

    let events = [];
    if (Array.isArray(body?.events)) {
      events = body.events;
    } else if (body?.event && typeof body.event === "object") {
      events = [body.event];
    } else if (body && typeof body === "object") {
      const { artistId: _artistId, ...singleEvent } = body;
      if (Object.keys(singleEvent).length > 0) {
        events = [singleEvent];
      }
    }

    if (!artistId || events.length === 0) {
      return NextResponse.json(
        { error: "Artist ID and events are required" },
        { status: 400 },
      );
    }

    const result = await createArtistSchedules(artistId, events);

    return NextResponse.json({
      success: true,
      inserted: result.inserted.length,
      total: result.total,
      data: result.inserted,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (error) {
    console.error("Artist schedule POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create schedules" },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    const scheduleId = new URL(request.url).searchParams.get("id");

    if (!scheduleId) {
      return NextResponse.json(
        { error: "Schedule ID is required" },
        { status: 400 },
      );
    }

    const cookieStore = await cookies();
    const { user, error: userError } = await getServerUser(cookieStore);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const updateData = await request.json();
    const updated = await updateArtistSchedule(scheduleId, updateData, user);

    return NextResponse.json({
      success: true,
      message: "Event updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Artist schedule PUT error:", error);
    const status =
      error.message === "Permission denied"
        ? 403
        : error.message === "Schedule event not found"
          ? 404
          : error.message?.startsWith("Missing required fields")
            ? 400
            : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function DELETE(request) {
  try {
    const scheduleId = new URL(request.url).searchParams.get("id");

    if (!scheduleId) {
      return NextResponse.json(
        { error: "Schedule ID is required" },
        { status: 400 },
      );
    }

    const cookieStore = await cookies();
    const { user, error: userError } = await getServerUser(cookieStore);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    await deleteArtistSchedule(scheduleId, user);

    return NextResponse.json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("Artist schedule DELETE error:", error);
    const status =
      error.message === "Permission denied"
        ? 403
        : error.message === "Schedule event not found"
          ? 404
          : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
