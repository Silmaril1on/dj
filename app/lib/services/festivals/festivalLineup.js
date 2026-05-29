import { revalidateTag, unstable_cache } from "next/cache";
import {
  ServiceError,
  getAuthenticatedContext,
  getSupabaseServerClient,
  getSupabaseAdminClient,
} from "../shared";

const normalizeArtistName = (name) => {
  if (!name) return "";
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ");
};

async function buildArtistMap(supabase) {
  const { data: allArtistsData } = await supabase
    .from("artists")
    .select("id, name, stage_name, artist_slug, image_url");

  const artistMap = new Map();
  if (allArtistsData) {
    allArtistsData.forEach((artist) => {
      const n = normalizeArtistName(artist.name);
      const s = normalizeArtistName(artist.stage_name);
      if (n) artistMap.set(n, artist);
      if (s) artistMap.set(s, artist);
    });
  }
  return artistMap;
}

async function saveLineupStages(festivalId, stages, lineup_status) {
  // Use admin client — ownership already verified by assertFestivalOwner.
  // RLS on festival_stages / festival_lineup blocks writes with the user client.
  const admin = getSupabaseAdminClient();

  for (let stageIndex = 0; stageIndex < stages.length; stageIndex++) {
    const stage = stages[stageIndex];

    const { data: insertedStage, error: stageError } = await admin
      .from("festival_stages")
      .insert({
        festival_id: festivalId,
        stage_name: stage.stage_name,
        stage_order: stageIndex,
      })
      .select()
      .single();

    if (stageError) throw new ServiceError("Failed to create stage", 500);

    const artistsToInsert = stage.artists.map((artist, artistIndex) => ({
      stage_id: insertedStage.id,
      artist_name: artist.name,
      artist_day: artist.day || null,
      time_from: artist.time_from || null,
      time_to: artist.time_to || null,
      artist_order: artistIndex,
      phase: artist.phase || lineup_status || null,
      support_act: artist.support_act || false,
    }));

    const { error: artistsError } = await admin
      .from("festival_lineup")
      .insert(artistsToInsert);
    if (artistsError) throw new ServiceError("Failed to save lineup", 500);
  }

  await admin
    .from("festivals")
    .update({ lineup_status: lineup_status || null })
    .eq("id", festivalId);
}

async function saveStandardLineup(festivalId, artists, lineup_status) {
  // Use admin client — ownership already verified by assertFestivalOwner.
  // Insert directly into festival_lineup with festival_id; no stage row created.
  // Each artist may be a string (legacy) or { name, phase } object.
  const admin = getSupabaseAdminClient();

  const artistsToInsert = artists.map((item, idx) => {
    const name = typeof item === "string" ? item : item.name;
    const phase =
      typeof item === "object" && item.phase !== undefined
        ? item.phase
        : lineup_status || null;
    const support_act =
      typeof item === "object" && item.support_act !== undefined
        ? Boolean(item.support_act)
        : false;
    return {
      festival_id: festivalId,
      stage_id: null,
      artist_name: name,
      artist_day: null,
      artist_order: idx,
      phase,
      support_act,
    };
  });

  const { error } = await admin.from("festival_lineup").insert(artistsToInsert);
  if (error) throw new ServiceError("Failed to save lineup", 500);

  await admin
    .from("festivals")
    .update({ lineup_status: lineup_status || null })
    .eq("id", festivalId);
}

/**
 * Invoke the send-lineup-notifications Supabase Edge Function.
 * Fire-and-forget — does not block lineup save; edge function runs independently
 * on Supabase's infrastructure so it completes even after this request ends.
 */
function triggerLineupNotifications(festivalId, phaseName) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return;

  fetch(`${supabaseUrl}/functions/v1/send-lineup-notifications`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({ festivalId, phaseName }),
  }).catch((err) =>
    console.error("[LINEUP NOTIFY] Edge function invoke failed:", err),
  );
}

async function clearAllLineupData(festivalId) {
  const admin = getSupabaseAdminClient();
  // Delete standard lineup entries (no stage row — keyed by festival_id + null stage_id)
  await admin
    .from("festival_lineup")
    .delete()
    .eq("festival_id", festivalId)
    .is("stage_id", null);
  // Delete enhanced stages — cascades to festival_lineup rows via FK on stage_id
  await admin.from("festival_stages").delete().eq("festival_id", festivalId);
}

export async function getStages(festivalId, cookieStore) {
  if (!festivalId) throw new ServiceError("Festival ID is required", 400);
  const supabase = await getSupabaseServerClient(cookieStore);

  const { data: stages, error } = await supabase
    .from("festival_stages")
    .select("id, stage_name, stage_order")
    .eq("festival_id", festivalId)
    .order("stage_order", { ascending: true });

  if (error) throw new ServiceError("Failed to fetch stages", 500);
  return { success: true, stages: stages || [] };
}

export async function getLineup(festivalId, cookieStore) {
  if (!festivalId) throw new ServiceError("Festival ID is required", 400);
  const supabase = await getSupabaseServerClient(cookieStore);
  const admin = getSupabaseAdminClient();

  // Wrap the heavy DB work in unstable_cache so repeated SSR renders within the
  // revalidation window hit the cache instead of the database.
  const cached = await unstable_cache(
    async () => {
      // Enhanced entries: join through festival_stages
      const { data: stagesWithLineup, error: stagesError } = await admin
        .from("festival_stages")
        .select(
          `id, stage_name, stage_order,
           festival_lineup (
             id, artist_name, artist_day, artist_order, phase, support_act, time_from, time_to
           )`,
        )
        .eq("festival_id", festivalId)
        .order("stage_order", { ascending: true });

      if (stagesError) throw new Error("Failed to fetch lineup");

      // Standard entries: festival_lineup rows with null stage_id
      const { data: rawStandardRows, error: standardError } = await admin
        .from("festival_lineup")
        .select("id, artist_name, phase, support_act")
        .eq("festival_id", festivalId)
        .is("stage_id", null)
        .order("artist_name", { ascending: true });

      if (standardError) throw new Error("Failed to fetch standard lineup");

      // Artist image / slug cross-reference
      const { data: allArtistsData } = await admin
        .from("artists")
        .select("id, name, stage_name, artist_slug, image_url");

      const artistMap = new Map();
      (allArtistsData || []).forEach((a) => {
        const n = normalizeArtistName(a.name);
        const s = normalizeArtistName(a.stage_name);
        if (n) artistMap.set(n, a);
        if (s) artistMap.set(s, a);
      });

      const mapArtistRow = (row) => {
        const found = artistMap.get(normalizeArtistName(row.artist_name));
        return {
          lineup_id: row.id,
          name: row.artist_name,
          day: row.artist_day || "",
          time_from: row.time_from || null,
          time_to: row.time_to || null,
          phase: row.phase || null,
          support_act: row.support_act || false,
          id: found?.id || null,
          artist_slug: found?.artist_slug || null,
          image_url: found?.image_url || null,
        };
      };

      const lineup = (stagesWithLineup || []).map((stage) => ({
        stage_name: stage.stage_name,
        artists: (stage.festival_lineup || [])
          .sort((a, b) => (a.artist_order ?? 0) - (b.artist_order ?? 0))
          .map(mapArtistRow),
      }));

      const standardArtists = (rawStandardRows || []).map((row) => {
        const found = artistMap.get(normalizeArtistName(row.artist_name));
        return {
          lineup_id: row.id,
          name: row.artist_name,
          phase: row.phase || null,
          support_act: row.support_act || false,
          id: found?.id || null,
          artist_slug: found?.artist_slug || null,
          image_url: found?.image_url || null,
        };
      });

      const hasEnhanced = lineup.length > 0;
      const hasStandard = standardArtists.length > 0;
      const lineupType =
        hasEnhanced && hasStandard
          ? "mixed"
          : hasEnhanced
            ? "enhanced"
            : hasStandard
              ? "standard"
              : "none";

      return {
        lineup,
        standardArtists,
        lineupType,
        stages: (stagesWithLineup || []).map((s) => ({
          id: s.id,
          stage_name: s.stage_name,
          stage_order: s.stage_order,
        })),
      };
    },
    [`festival-lineup-${festivalId}`],
    {
      revalidate: 3600, // 1 hour fallback; mutations call revalidateTag immediately
      tags: [`festival-lineup-${festivalId}`],
    },
  )();

  return { success: true, ...cached };
}

async function assertFestivalOwner(user, festivalId) {
  const admin = getSupabaseAdminClient();
  const { data: festival, error } = await admin
    .from("festivals")
    .select("user_id")
    .eq("id", festivalId)
    .single();

  if (error || !festival) {
    throw new ServiceError("Festival not found", 404);
  }
  if (festival.user_id !== user.id && !user.is_admin) {
    throw new ServiceError("Unauthorized to modify this festival", 403);
  }
}

export async function createLineup(
  { festival_id, lineup_type, stages, artists, lineup_status },
  cookieStore,
) {
  if (!festival_id) {
    throw new ServiceError("Festival ID is required", 400);
  }

  const { user } = await getAuthenticatedContext(cookieStore);
  await assertFestivalOwner(user, festival_id);

  if (lineup_type === "standard") {
    if (!artists || artists.length === 0) {
      throw new ServiceError("At least one artist is required", 400);
    }
    await saveStandardLineup(festival_id, artists, lineup_status);
  } else {
    if (!stages || stages.length === 0) {
      throw new ServiceError("At least one stage is required", 400);
    }
    await saveLineupStages(festival_id, stages, lineup_status);
  }

  revalidateTag(`festival-lineup-${festival_id}`);

  // Fire-and-forget: invoke edge function to notify subscribers
  const phaseLabel = lineup_status
    ? lineup_status.replace(/\b\w/g, (c) => c.toUpperCase())
    : "New";
  triggerLineupNotifications(festival_id, `${phaseLabel} Lineup`);

  return {
    success: true,
    message: "Lineup created successfully",
    phase_applied: lineup_status,
  };
}

export async function updateLineup(
  { festival_id, lineup_type, stages, artists, lineup_status },
  cookieStore,
) {
  if (!festival_id) {
    throw new ServiceError("Festival ID is required", 400);
  }

  const { user } = await getAuthenticatedContext(cookieStore);
  await assertFestivalOwner(user, festival_id);

  // Clear all existing lineup data (stages + standard entries)
  await clearAllLineupData(festival_id);

  if (lineup_type === "standard") {
    if (!artists || artists.length === 0) {
      throw new ServiceError("At least one artist is required", 400);
    }
    await saveStandardLineup(festival_id, artists, lineup_status);
  } else {
    if (!stages || stages.length === 0) {
      throw new ServiceError("At least one stage is required", 400);
    }
    await saveLineupStages(festival_id, stages, lineup_status);
  }

  revalidateTag(`festival-lineup-${festival_id}`);

  // Fire-and-forget: invoke edge function to notify subscribers
  const phaseLabel = lineup_status
    ? lineup_status.replace(/\b\w/g, (c) => c.toUpperCase())
    : "Updated";
  triggerLineupNotifications(festival_id, `${phaseLabel} Lineup`);

  return {
    success: true,
    message: "Lineup updated successfully",
    phase_applied: lineup_status,
  };
}

export async function updateLineupArtist(
  { lineup_id, festival_id, name, phase, stage_id, day, support_act },
  cookieStore,
) {
  if (!lineup_id || !festival_id)
    throw new ServiceError("lineup_id and festival_id are required", 400);

  const { user } = await getAuthenticatedContext(cookieStore);
  await assertFestivalOwner(user, festival_id);

  const admin = getSupabaseAdminClient();
  const update = {};
  if (name !== undefined) update.artist_name = name;
  if (phase !== undefined) update.phase = phase;
  if (stage_id !== undefined) update.stage_id = stage_id;
  if (day !== undefined) update.artist_day = day || null;
  if (support_act !== undefined) update.support_act = Boolean(support_act);

  const { error } = await admin
    .from("festival_lineup")
    .update(update)
    .eq("id", lineup_id);

  if (error) throw new ServiceError("Failed to update artist", 500);
  revalidateTag(`festival-lineup-${festival_id}`);
  return { success: true };
}

export async function deleteLineupArtist(
  { lineup_id, festival_id },
  cookieStore,
) {
  if (!lineup_id || !festival_id)
    throw new ServiceError("lineup_id and festival_id are required", 400);

  const { user } = await getAuthenticatedContext(cookieStore);
  await assertFestivalOwner(user, festival_id);

  const admin = getSupabaseAdminClient();
  const { error } = await admin
    .from("festival_lineup")
    .delete()
    .eq("id", lineup_id);

  if (error) throw new ServiceError("Failed to delete artist", 500);
  revalidateTag(`festival-lineup-${festival_id}`);
  return { success: true };
}

export async function deleteFullLineup({ festival_id }, cookieStore) {
  if (!festival_id) throw new ServiceError("Festival ID is required", 400);

  const { user } = await getAuthenticatedContext(cookieStore);
  await assertFestivalOwner(user, festival_id);

  await clearAllLineupData(festival_id);

  const admin = getSupabaseAdminClient();
  await admin
    .from("festivals")
    .update({ lineup_status: null })
    .eq("id", festival_id);

  revalidateTag(`festival-lineup-${festival_id}`);
  return { success: true, message: "Full lineup deleted" };
}
