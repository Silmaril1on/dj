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

const normalizeStageName = (name) => {
  if (!name) return "";
  return name.toLowerCase().trim().replace(/\s+/g, " ");
};

const STANDARD_STAGE_NAME = "__standard__";
const STANDARD_STAGE_ORDER = -1;

const EDITION_FIELDS =
  "id, festival_id, edition_year, start_date, end_date, status";

const parseDateValue = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getEditionSortValue = (edition) => {
  const parsed =
    parseDateValue(edition?.start_date) ||
    parseDateValue(edition?.end_date) ||
    (edition?.edition_year ? new Date(`${edition.edition_year}-12-31`) : null);
  return parsed ? parsed.getTime() : null;
};

const pickCurrentEdition = (editions) => {
  if (!Array.isArray(editions) || editions.length === 0) return null;

  const upcoming = editions.filter((e) => e.status === "upcoming");
  if (upcoming.length > 0) {
    return upcoming.slice().sort((a, b) => {
      const aValue = getEditionSortValue(a);
      const bValue = getEditionSortValue(b);
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return 1;
      if (bValue === null) return -1;
      return aValue - bValue;
    })[0];
  }

  return editions.slice().sort((a, b) => {
    const aValue = getEditionSortValue(a);
    const bValue = getEditionSortValue(b);
    if (aValue === null && bValue === null) return 0;
    if (aValue === null) return 1;
    if (bValue === null) return -1;
    return bValue - aValue;
  })[0];
};

const buildLineupTag = (festivalId, editionId) =>
  `festival-lineup-${festivalId}-${editionId || "none"}`;

async function resolveEditionId(festivalId, editionId) {
  if (editionId) return editionId;

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("festival_editions")
    .select(EDITION_FIELDS)
    .eq("festival_id", festivalId);

  if (error) throw new ServiceError("Failed to fetch festival editions", 500);

  const currentEdition = pickCurrentEdition(data || []);
  return currentEdition?.id || null;
}

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

async function buildStageMap(admin, festivalId) {
  const { data, error } = await admin
    .from("festival_stages")
    .select("id, stage_name, stage_order, created_at")
    .eq("festival_id", festivalId);

  if (error) throw new ServiceError("Failed to fetch festival stages", 500);

  const map = new Map();
  (data || []).forEach((stage) => {
    const key = normalizeStageName(stage.stage_name);
    if (!key) return;

    const existing = map.get(key);
    if (!existing) {
      map.set(key, stage);
      return;
    }

    const existingTime = existing.created_at
      ? new Date(existing.created_at).getTime()
      : null;
    const nextTime = stage.created_at
      ? new Date(stage.created_at).getTime()
      : null;

    if (existingTime === null && nextTime === null) return;
    if (
      existingTime === null ||
      (nextTime !== null && nextTime < existingTime)
    ) {
      map.set(key, stage);
    }
  });

  return map;
}

async function getOrCreateStandardStage(admin, festivalId, stageMap) {
  const key = normalizeStageName(STANDARD_STAGE_NAME);
  let stage = stageMap.get(key);

  if (!stage) {
    const { data, error } = await admin
      .from("festival_stages")
      .insert({
        festival_id: festivalId,
        stage_name: STANDARD_STAGE_NAME,
        stage_order: STANDARD_STAGE_ORDER,
      })
      .select()
      .single();

    if (error) throw new ServiceError("Failed to create standard stage", 500);
    stage = data;
    stageMap.set(key, stage);
  } else if (stage.stage_order !== STANDARD_STAGE_ORDER) {
    await admin
      .from("festival_stages")
      .update({ stage_order: STANDARD_STAGE_ORDER })
      .eq("id", stage.id);
  }

  return stage;
}

async function hasExistingLineup(admin, festivalId, editionId) {
  const { data: stageRows, error: stageError } = await admin
    .from("festival_stages")
    .select("id")
    .eq("festival_id", festivalId);

  if (stageError)
    throw new ServiceError("Failed to fetch festival stages", 500);

  const stageIds = (stageRows || []).map((row) => row.id);
  if (stageIds.length === 0) return false;

  let query = admin
    .from("festival_lineup")
    .select("id", { count: "exact", head: true })
    .in("stage_id", stageIds);

  query = editionId
    ? query.eq("edition_id", editionId)
    : query.is("edition_id", null);

  const { count, error } = await query;
  if (error) throw new ServiceError("Failed to check existing lineup", 500);
  return (count || 0) > 0;
}

async function saveLineupStages(festivalId, stages, lineup_status, editionId) {
  // Use admin client — ownership already verified by assertFestivalOwner.
  // RLS on festival_stages / festival_lineup blocks writes with the user client.
  const admin = getSupabaseAdminClient();
  const stageMap = await buildStageMap(admin, festivalId);

  for (let stageIndex = 0; stageIndex < stages.length; stageIndex++) {
    const stage = stages[stageIndex];

    const stageKey = normalizeStageName(stage.stage_name);
    let resolvedStage = stageKey ? stageMap.get(stageKey) : null;

    if (!resolvedStage) {
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
      resolvedStage = insertedStage;
      if (stageKey) stageMap.set(stageKey, insertedStage);
    } else if (resolvedStage.stage_order !== stageIndex) {
      await admin
        .from("festival_stages")
        .update({ stage_order: stageIndex })
        .eq("id", resolvedStage.id);
    }

    const artistsToInsert = stage.artists.map((artist, artistIndex) => ({
      stage_id: resolvedStage.id,
      artist_name: artist.name,
      artist_day: artist.day || null,
      time_from: artist.time_from || null,
      time_to: artist.time_to || null,
      artist_order: artistIndex,
      phase: artist.phase || lineup_status || null,
      support_act: artist.support_act || false,
      edition_id: editionId || null,
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

async function saveStandardLineup(
  festivalId,
  artists,
  lineup_status,
  editionId,
) {
  // Use admin client — ownership already verified by assertFestivalOwner.
  // Insert directly into festival_lineup with a hidden standard stage.
  // Each artist may be a string (legacy) or { name, phase } object.
  const admin = getSupabaseAdminClient();
  const stageMap = await buildStageMap(admin, festivalId);
  const standardStage = await getOrCreateStandardStage(
    admin,
    festivalId,
    stageMap,
  );

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
      stage_id: standardStage.id,
      artist_name: name,
      artist_day: null,
      artist_order: idx,
      phase,
      support_act,
      edition_id: editionId || null,
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

async function clearAllLineupData(festivalId, editionId) {
  const admin = getSupabaseAdminClient();
  const { data: stageRows, error } = await admin
    .from("festival_stages")
    .select("id")
    .eq("festival_id", festivalId);

  if (error) throw new ServiceError("Failed to fetch festival stages", 500);

  const stageIds = (stageRows || []).map((row) => row.id);
  if (stageIds.length === 0) return;

  let query = admin.from("festival_lineup").delete().in("stage_id", stageIds);
  query = editionId
    ? query.eq("edition_id", editionId)
    : query.is("edition_id", null);
  await query;
}

export async function getStages(festivalId, cookieStore) {
  if (!festivalId) throw new ServiceError("Festival ID is required", 400);
  const supabase = await getSupabaseServerClient(cookieStore);

  const { data: stages, error } = await supabase
    .from("festival_stages")
    .select("id, stage_name, stage_order")
    .eq("festival_id", festivalId)
    .neq("stage_name", STANDARD_STAGE_NAME)
    .order("stage_order", { ascending: true });

  if (error) throw new ServiceError("Failed to fetch stages", 500);
  return { success: true, stages: stages || [] };
}

export async function getLineup(festivalId, cookieStore, editionId = null) {
  if (!festivalId) throw new ServiceError("Festival ID is required", 400);
  const supabase = await getSupabaseServerClient(cookieStore);
  const admin = getSupabaseAdminClient();

  const effectiveEditionId = await resolveEditionId(festivalId, editionId);
  const cacheTag = buildLineupTag(festivalId, effectiveEditionId);

  // Wrap the heavy DB work in unstable_cache so repeated SSR renders within the
  // revalidation window hit the cache instead of the database.
  const cached = await unstable_cache(
    async () => {
      const editionFilter = effectiveEditionId || null;
      const { data: stages, error: stagesError } = await admin
        .from("festival_stages")
        .select("id, stage_name, stage_order")
        .eq("festival_id", festivalId)
        .neq("stage_name", STANDARD_STAGE_NAME)
        .order("stage_order", { ascending: true });

      if (stagesError) throw new Error("Failed to fetch stages");

      const stageIds = (stages || []).map((stage) => stage.id);
      let lineupRows = [];

      if (stageIds.length > 0) {
        let lineupQuery = admin
          .from("festival_lineup")
          .select(
            "id, stage_id, artist_name, artist_day, artist_order, phase, support_act, time_from, time_to, edition_id",
          )
          .in("stage_id", stageIds)
          .order("artist_order", { ascending: true });

        lineupQuery = editionFilter
          ? lineupQuery.eq("edition_id", editionFilter)
          : lineupQuery.is("edition_id", null);

        const { data: rows, error: lineupError } = await lineupQuery;
        if (lineupError) throw new Error("Failed to fetch lineup");
        lineupRows = rows || [];
      }

      let rawStandardRows = [];
      const { data: standardStage, error: standardStageError } = await admin
        .from("festival_stages")
        .select("id")
        .eq("festival_id", festivalId)
        .eq("stage_name", STANDARD_STAGE_NAME)
        .limit(1)
        .maybeSingle();

      if (standardStageError) throw new Error("Failed to fetch standard stage");

      if (standardStage?.id) {
        let standardQuery = admin
          .from("festival_lineup")
          .select("id, artist_name, phase, support_act, edition_id")
          .eq("stage_id", standardStage.id)
          .order("artist_name", { ascending: true });

        standardQuery = editionFilter
          ? standardQuery.eq("edition_id", editionFilter)
          : standardQuery.is("edition_id", null);

        const { data, error: standardError } = await standardQuery;
        if (standardError) throw new Error("Failed to fetch standard lineup");
        rawStandardRows = data || [];
      }

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

      const lineupByStage = new Map();
      lineupRows.forEach((row) => {
        if (!row?.stage_id) return;
        const bucket = lineupByStage.get(row.stage_id) || [];
        bucket.push(row);
        lineupByStage.set(row.stage_id, bucket);
      });

      const lineup = (stages || [])
        .map((stage) => {
          const rows = lineupByStage.get(stage.id) || [];
          rows.sort((a, b) => (a.artist_order ?? 0) - (b.artist_order ?? 0));
          return {
            stage_name: stage.stage_name,
            artists: rows.map(mapArtistRow),
          };
        })
        .filter((stage) => stage.artists.length > 0);

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
        stages: (stages || [])
          .filter((s) => (lineupByStage.get(s.id) || []).length > 0)
          .map((s) => ({
            id: s.id,
            stage_name: s.stage_name,
            stage_order: s.stage_order,
          })),
      };
    },
    [cacheTag],
    {
      revalidate: 3600, // 1 hour fallback; mutations call revalidateTag immediately
      tags: [cacheTag],
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
  { festival_id, lineup_type, stages, artists, lineup_status, edition_id },
  cookieStore,
) {
  if (!festival_id) {
    throw new ServiceError("Festival ID is required", 400);
  }

  const effectiveEditionId = await resolveEditionId(festival_id, edition_id);
  if (!effectiveEditionId) {
    throw new ServiceError("Festival edition not found", 404);
  }

  const { user } = await getAuthenticatedContext(cookieStore);
  await assertFestivalOwner(user, festival_id);

  const admin = getSupabaseAdminClient();
  const alreadyExists = await hasExistingLineup(
    admin,
    festival_id,
    effectiveEditionId,
  );

  if (alreadyExists) {
    return await updateLineup(
      {
        festival_id,
        lineup_type,
        stages,
        artists,
        lineup_status,
        edition_id: effectiveEditionId,
      },
      cookieStore,
    );
  }

  if (lineup_type === "standard") {
    if (!artists || artists.length === 0) {
      throw new ServiceError("At least one artist is required", 400);
    }
    await saveStandardLineup(
      festival_id,
      artists,
      lineup_status,
      effectiveEditionId,
    );
  } else {
    if (!stages || stages.length === 0) {
      throw new ServiceError("At least one stage is required", 400);
    }
    await saveLineupStages(
      festival_id,
      stages,
      lineup_status,
      effectiveEditionId,
    );
  }

  revalidateTag(buildLineupTag(festival_id, effectiveEditionId));

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

/**
 * Append only genuinely new standard artists (no lineup_id) to the existing
 * standard stage, continuing the artist_order sequence.
 */
async function appendStandardArtists(
  festivalId,
  newArtists,
  lineup_status,
  editionId,
) {
  const admin = getSupabaseAdminClient();
  const stageMap = await buildStageMap(admin, festivalId);
  const standardStage = await getOrCreateStandardStage(
    admin,
    festivalId,
    stageMap,
  );

  // Find the current max artist_order so we continue numbering correctly
  let maxOrderQuery = admin
    .from("festival_lineup")
    .select("artist_order")
    .eq("stage_id", standardStage.id)
    .order("artist_order", { ascending: false })
    .limit(1);
  maxOrderQuery = editionId
    ? maxOrderQuery.eq("edition_id", editionId)
    : maxOrderQuery.is("edition_id", null);
  const { data: maxOrderRow } = await maxOrderQuery;
  const startOrder = (maxOrderRow?.[0]?.artist_order ?? -1) + 1;

  const artistsToInsert = newArtists.map((item, idx) => {
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
      stage_id: standardStage.id,
      artist_name: name,
      artist_day: null,
      artist_order: startOrder + idx,
      phase,
      support_act,
      edition_id: editionId || null,
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
 * Upsert enhanced lineup stages:
 *   - Artists with lineup_id  → UPDATE (day, time, phase, order, etc.)
 *   - Artists without lineup_id → INSERT as new rows
 * Never deletes rows — removals are done via the individual DELETE endpoint.
 */
async function upsertLineupStages(
  festivalId,
  stages,
  lineup_status,
  editionId,
) {
  const admin = getSupabaseAdminClient();
  const stageMap = await buildStageMap(admin, festivalId);

  for (let stageIndex = 0; stageIndex < stages.length; stageIndex++) {
    const stage = stages[stageIndex];
    const stageKey = normalizeStageName(stage.stage_name);
    let resolvedStage = stageKey ? stageMap.get(stageKey) : null;

    if (!resolvedStage) {
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
      resolvedStage = insertedStage;
      if (stageKey) stageMap.set(stageKey, insertedStage);
    } else if (resolvedStage.stage_order !== stageIndex) {
      await admin
        .from("festival_stages")
        .update({ stage_order: stageIndex })
        .eq("id", resolvedStage.id);
    }

    const toInsert = [];
    for (
      let artistIndex = 0;
      artistIndex < stage.artists.length;
      artistIndex++
    ) {
      const artist = stage.artists[artistIndex];
      const artistData = {
        stage_id: resolvedStage.id,
        artist_name: artist.name,
        artist_day: artist.day || null,
        time_from: artist.time_from || null,
        time_to: artist.time_to || null,
        artist_order: artistIndex,
        phase:
          artist.phase !== undefined ? artist.phase : lineup_status || null,
        support_act: artist.support_act || false,
        edition_id: editionId || null,
      };

      if (artist.lineup_id) {
        // UPDATE existing row — never wipe data that isn't in the form
        const { error } = await admin
          .from("festival_lineup")
          .update(artistData)
          .eq("id", artist.lineup_id);
        if (error) throw new ServiceError("Failed to update artist", 500);
      } else {
        toInsert.push(artistData);
      }
    }

    if (toInsert.length > 0) {
      const { error } = await admin.from("festival_lineup").insert(toInsert);
      if (error) throw new ServiceError("Failed to insert new artists", 500);
    }
  }

  await admin
    .from("festivals")
    .update({ lineup_status: lineup_status || null })
    .eq("id", festivalId);
}

export async function updateLineup(
  { festival_id, lineup_type, stages, artists, lineup_status, edition_id },
  cookieStore,
) {
  if (!festival_id) {
    throw new ServiceError("Festival ID is required", 400);
  }

  const effectiveEditionId = await resolveEditionId(festival_id, edition_id);
  if (!effectiveEditionId) {
    throw new ServiceError("Festival edition not found", 404);
  }

  const { user } = await getAuthenticatedContext(cookieStore);
  await assertFestivalOwner(user, festival_id);

  if (lineup_type === "standard") {
    // Only INSERT genuinely new artists — existing ones are managed via
    // individual edit/delete, not by wiping and re-inserting everything.
    const newArtists = (artists || []).filter((a) => !a.lineup_id);
    if (newArtists.length > 0) {
      await appendStandardArtists(
        festival_id,
        newArtists,
        lineup_status,
        effectiveEditionId,
      );
    } else {
      // No new artists — just keep lineup_status current
      const admin = getSupabaseAdminClient();
      await admin
        .from("festivals")
        .update({ lineup_status: lineup_status || null })
        .eq("id", festival_id);
    }
  } else {
    if (!stages || stages.length === 0) {
      throw new ServiceError("At least one stage is required", 400);
    }
    // UPDATE artists that have a lineup_id, INSERT artists that don't.
    // Never calls clearAllLineupData — SQL-inserted rows are preserved.
    await upsertLineupStages(
      festival_id,
      stages,
      lineup_status,
      effectiveEditionId,
    );
  }

  revalidateTag(buildLineupTag(festival_id, effectiveEditionId));

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
  let resolvedStageId = stage_id;
  if (stage_id !== undefined && !stage_id) {
    const stageMap = await buildStageMap(admin, festival_id);
    const standardStage = await getOrCreateStandardStage(
      admin,
      festival_id,
      stageMap,
    );
    resolvedStageId = standardStage.id;
  }
  const update = {};
  if (name !== undefined) update.artist_name = name;
  if (phase !== undefined) update.phase = phase;
  if (stage_id !== undefined) update.stage_id = resolvedStageId;
  if (day !== undefined) update.artist_day = day || null;
  if (support_act !== undefined) update.support_act = Boolean(support_act);

  const { data: updatedRow, error } = await admin
    .from("festival_lineup")
    .update(update)
    .eq("id", lineup_id)
    .select("edition_id")
    .single();

  if (error) throw new ServiceError("Failed to update artist", 500);
  revalidateTag(buildLineupTag(festival_id, updatedRow?.edition_id || null));
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
  const { data: existingRow } = await admin
    .from("festival_lineup")
    .select("edition_id")
    .eq("id", lineup_id)
    .single();

  const { error } = await admin
    .from("festival_lineup")
    .delete()
    .eq("id", lineup_id);

  if (error) throw new ServiceError("Failed to delete artist", 500);
  revalidateTag(buildLineupTag(festival_id, existingRow?.edition_id || null));
  return { success: true };
}

export async function deleteFullLineup(
  { festival_id, edition_id },
  cookieStore,
) {
  if (!festival_id) throw new ServiceError("Festival ID is required", 400);

  const { user } = await getAuthenticatedContext(cookieStore);
  await assertFestivalOwner(user, festival_id);

  const effectiveEditionId = await resolveEditionId(festival_id, edition_id);
  await clearAllLineupData(festival_id, effectiveEditionId);

  const admin = getSupabaseAdminClient();
  const { data: stageRows, error: stageError } = await admin
    .from("festival_stages")
    .select("id")
    .eq("festival_id", festival_id);

  if (stageError)
    throw new ServiceError("Failed to fetch festival stages", 500);

  const stageIds = (stageRows || []).map((row) => row.id);
  let remainingRows = [];
  if (stageIds.length > 0) {
    const { data } = await admin
      .from("festival_lineup")
      .select("id")
      .in("stage_id", stageIds)
      .limit(1);
    remainingRows = data || [];
  }

  if (!remainingRows || remainingRows.length === 0) {
    await admin
      .from("festivals")
      .update({ lineup_status: null })
      .eq("id", festival_id);
  }

  revalidateTag(buildLineupTag(festival_id, effectiveEditionId));
  return { success: true, message: "Full lineup deleted" };
}

export async function revalidateLineupCache(
  { festival_id, edition_id },
  cookieStore,
) {
  if (!festival_id) throw new ServiceError("Festival ID is required", 400);
  const { user } = await getAuthenticatedContext(cookieStore);
  if (!user.is_admin) {
    throw new ServiceError("Admin access required", 403);
  }
  const effectiveEditionId = await resolveEditionId(festival_id, edition_id);
  revalidateTag(buildLineupTag(festival_id, effectiveEditionId));
  return { success: true };
}
