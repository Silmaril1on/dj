import {
  ServiceError,
  getAuthenticatedContext,
  getSupabaseServerClient,
  getSupabaseAdminClient,
} from "../submit-data-types/shared";

const CLUB_DATE_SELECT =
  "id, club_id, date, time, event_link, event_title, minimum_age, event_status, lineup, created_at";

function formatScheduleItem(item) {
  return {
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
  };
}

export async function getClubDates(
  clubId,
  { limit = 20, offset = 0 } = {},
  cookieStore,
) {
  if (!clubId) throw new ServiceError("Club ID is required", 400);
  const supabase = await getSupabaseServerClient(cookieStore);

  const { data: clubDates, error } = await supabase
    .from("club_dates")
    .select(CLUB_DATE_SELECT)
    .eq("club_id", clubId)
    .order("date", { ascending: true })
    .order("id", { ascending: true })
    .range(offset, offset + limit);

  if (error) throw new ServiceError("Failed to fetch club dates", 500);

  const hasMore = (clubDates || []).length > limit;
  const trimmed = hasMore ? clubDates.slice(0, limit) : clubDates || [];

  return {
    success: true,
    data: trimmed.map(formatScheduleItem),
    hasMore,
    nextOffset: hasMore ? offset + limit : null,
  };
}

export async function createClubDate(clubId, formData, cookieStore) {
  if (!clubId) throw new ServiceError("Club ID is required", 400);

  const { user } = await getAuthenticatedContext(cookieStore);
  const admin = getSupabaseAdminClient();

  const { data: club, error: clubError } = await admin
    .from("clubs")
    .select("id, user_id, name")
    .eq("id", clubId)
    .single();

  if (clubError || !club) throw new ServiceError("Club not found", 404);

  const submittedClubId = user.submitted_club_id;
  const ownsClubBySubmittedId = Array.isArray(submittedClubId)
    ? submittedClubId.includes(clubId)
    : submittedClubId === clubId;

  if (!user.is_admin && club.user_id !== user.id && !ownsClubBySubmittedId) {
    throw new ServiceError("You do not have permission to add club dates", 403);
  }

  const date = formData.get("date");
  const time = formData.get("time") || null;
  const eventLink = formData.get("event_link") || null;
  const eventTitle = formData.get("event_title");
  const minimumAgeRaw = formData.get("minimum_age");

  if (!date || !eventTitle || eventTitle.trim() === "") {
    throw new ServiceError("Missing required fields: date, event_title", 400);
  }

  let minimumAge = null;
  if (minimumAgeRaw !== null && `${minimumAgeRaw}`.trim() !== "") {
    const parsedAge = Number(minimumAgeRaw);
    if (!Number.isFinite(parsedAge) || parsedAge < 0) {
      throw new ServiceError(
        "minimum_age must be a valid non-negative number",
        400,
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
    lineup = lineupJsonString ? JSON.parse(lineupJsonString) : lineupEntries;
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

  const { data: insertedDate, error: insertError } = await admin
    .from("club_dates")
    .insert({
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
    })
    .select()
    .single();

  if (insertError) {
    throw new ServiceError(
      insertError.message || "Failed to create club date",
      500,
    );
  }

  return {
    success: true,
    message: "Club date created successfully",
    data: insertedDate,
  };
}

export async function deleteClubDate(dateId, cookieStore) {
  if (!dateId) throw new ServiceError("Date ID is required", 400);

  const { user } = await getAuthenticatedContext(cookieStore);
  const admin = getSupabaseAdminClient();

  const { data: clubDate, error: fetchError } = await admin
    .from("club_dates")
    .select("id, club_id, clubs(user_id)")
    .eq("id", dateId)
    .single();

  if (fetchError || !clubDate)
    throw new ServiceError("Club date not found", 404);

  const submittedClubId = user.submitted_club_id;
  const ownsClubBySubmittedId = Array.isArray(submittedClubId)
    ? submittedClubId.includes(clubDate.club_id)
    : submittedClubId === clubDate.club_id;

  if (
    !user.is_admin &&
    clubDate.clubs?.user_id !== user.id &&
    !ownsClubBySubmittedId
  ) {
    throw new ServiceError(
      "You do not have permission to delete this date",
      403,
    );
  }

  const { error: deleteError } = await admin
    .from("club_dates")
    .delete()
    .eq("id", dateId);

  if (deleteError) throw new ServiceError(deleteError.message, 500);

  return { success: true, message: "Club date deleted successfully" };
}

export async function updateClubDate(dateId, data, cookieStore) {
  if (!dateId) throw new ServiceError("Date ID is required", 400);

  const { user } = await getAuthenticatedContext(cookieStore);
  const admin = getSupabaseAdminClient();

  const { data: clubDate, error: fetchError } = await admin
    .from("club_dates")
    .select("id, club_id, clubs(user_id)")
    .eq("id", dateId)
    .single();

  if (fetchError || !clubDate)
    throw new ServiceError("Club date not found", 404);

  const submittedClubId = user.submitted_club_id;
  const ownsClubBySubmittedId = Array.isArray(submittedClubId)
    ? submittedClubId.includes(clubDate.club_id)
    : submittedClubId === clubDate.club_id;

  if (
    !user.is_admin &&
    clubDate.clubs?.user_id !== user.id &&
    !ownsClubBySubmittedId
  ) {
    throw new ServiceError(
      "You do not have permission to update this date",
      403,
    );
  }

  const updatePayload = {
    updated_at: new Date().toISOString(),
  };
  if (data.date !== undefined) updatePayload.date = data.date;
  if (data.time !== undefined) updatePayload.time = data.time || null;
  if (data.event_link !== undefined)
    updatePayload.event_link = data.event_link || null;
  if (data.event_title !== undefined)
    updatePayload.event_title = data.event_title || null;
  if (data.minimum_age !== undefined) {
    const age = Number(data.minimum_age);
    updatePayload.minimum_age = Number.isFinite(age) && age >= 0 ? age : null;
  }
  if (data.event_status !== undefined)
    updatePayload.event_status = data.event_status;

  const { data: updated, error: updateError } = await admin
    .from("club_dates")
    .update(updatePayload)
    .eq("id", dateId)
    .select()
    .single();

  if (updateError) throw new ServiceError(updateError.message, 500);

  return {
    success: true,
    message: "Club date updated successfully",
    data: updated,
  };
}
