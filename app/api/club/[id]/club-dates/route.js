import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createSupabaseServerClient,
  getServerUser,
  supabaseAdmin,
} from "@/app/lib/config/supabaseServer";

export async function GET(request, { params }) {
  try {
    const { id: clubId } = await params;

    if (!clubId) {
      return NextResponse.json(
        { success: false, error: "Club ID is required" },
        { status: 400 },
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);

    const { data: clubDates, error } = await supabase
      .from("club_dates")
      .select(
        "id, club_id, date, time, event_link, event_title, minimum_age, event_status, lineup, created_at",
      )
      .eq("club_id", clubId)
      .order("date", { ascending: true })
      .order("id", { ascending: true })
      .range(offset, offset + limit);

    if (error) {
      console.error("Error fetching club dates:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch club dates" },
        { status: 500 },
      );
    }

    const hasMore = (clubDates || []).length > limit;
    const trimmed = hasMore ? clubDates.slice(0, limit) : clubDates || [];

    const scheduleData = trimmed.map((item) => ({
      id: item.id,
      date: item.date,
      time: item.time || "TBA",
      event_link: item.event_link,
      event_title: item.event_title,
      event_name: item.event_title,
      minimum_age: item.minimum_age,
      event_status: item.event_status || "upcoming",
      lineup: item.lineup || [],
      created_at: item.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: scheduleData,
      hasMore,
      nextOffset: hasMore ? offset + limit : null,
    });
  } catch (err) {
    console.error("Unexpected error in GET /api/club/[id]/club-dates:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request, { params }) {
  try {
    const { id: clubId } = await params;

    if (!clubId) {
      return NextResponse.json(
        { success: false, error: "Club ID is required" },
        { status: 400 },
      );
    }

    const cookieStore = await cookies();
    const { user, error: userError } = await getServerUser(cookieStore);

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    const supabase = await createSupabaseServerClient(cookieStore);

    const { data: club, error: clubError } = await supabaseAdmin
      .from("clubs")
      .select("id, user_id, name")
      .eq("id", clubId)
      .single();

    if (clubError || !club) {
      return NextResponse.json(
        { success: false, error: "Club not found" },
        { status: 404 },
      );
    }

    const submittedClubId = user.submitted_club_id;
    const ownsClubBySubmittedId = Array.isArray(submittedClubId)
      ? submittedClubId.includes(clubId)
      : submittedClubId === clubId;
    const canManage =
      user.is_admin || club.user_id === user.id || ownsClubBySubmittedId;

    if (!canManage) {
      return NextResponse.json(
        {
          success: false,
          error: "You do not have permission to add club dates",
        },
        { status: 403 },
      );
    }

    const formData = await request.formData();
    const date = formData.get("date");
    const time = formData.get("time") || null;
    const eventLink = formData.get("event_link") || null;
    const eventTitle = formData.get("event_title");
    const minimumAgeRaw = formData.get("minimum_age");

    if (!date || !eventTitle || eventTitle.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Missing required fields: date, event_title" },
        { status: 400 },
      );
    }

    let minimumAge = null;
    if (minimumAgeRaw !== null && `${minimumAgeRaw}`.trim() !== "") {
      const parsedAge = Number(minimumAgeRaw);
      if (!Number.isFinite(parsedAge) || parsedAge < 0) {
        return NextResponse.json(
          {
            success: false,
            error: "minimum_age must be a valid non-negative number",
          },
          { status: 400 },
        );
      }
      minimumAge = parsedAge;
    }

    let lineup = [];
    try {
      const lineupEntries = formData.getAll("lineup");
      const lineupJsonString = lineupEntries.find((entry) => {
        if (typeof entry !== "string") return false;
        try {
          JSON.parse(entry);
          return true;
        } catch {
          return false;
        }
      });

      if (lineupJsonString) {
        lineup = JSON.parse(lineupJsonString);
      } else {
        lineup = lineupEntries;
      }
    } catch {
      lineup = [];
    }

    lineup = Array.isArray(lineup)
      ? lineup
          .filter(
            (item) => item && typeof item === "string" && item.trim() !== "",
          )
          .map((item) => item.trim())
      : [];

    const insertPayload = {
      club_id: clubId,
      date,
      time,
      event_link: eventLink,
      event_title: eventTitle,
      status: "approved",
      minimum_age: minimumAge,
      event_status: "upcoming",
      lineup,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: insertedDate, error: insertError } = await supabaseAdmin
      .from("club_dates")
      .insert(insertPayload)
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        {
          success: false,
          error: insertError.message || "Failed to create club date",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Club date created successfully",
      data: insertedDate,
    });
  } catch (err) {
    console.error("Unexpected error in POST /api/club/[id]/club-dates:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
