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
      artist_order: artistIndex,
      phase: artist.phase || lineup_status || null,
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
  const admin = getSupabaseAdminClient();

  const artistsToInsert = artists.map((name, idx) => ({
    festival_id: festivalId,
    stage_id: null,
    artist_name: name,
    artist_day: null,
    artist_order: idx,
    phase: lineup_status || null,
  }));

  const { error } = await admin.from("festival_lineup").insert(artistsToInsert);
  if (error) throw new ServiceError("Failed to save lineup", 500);

  await admin
    .from("festivals")
    .update({ lineup_status: lineup_status || null })
    .eq("id", festivalId);
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

  // Enhanced entries: join through festival_stages
  const { data: stagesWithLineup, error: stagesError } = await supabase
    .from("festival_stages")
    .select(
      `id, stage_name, stage_order,
       festival_lineup (
         id, artist_name, artist_day, artist_order, phase
       )`,
    )
    .eq("festival_id", festivalId)
    .order("stage_order", { ascending: true });

  if (stagesError) throw new ServiceError("Failed to fetch lineup", 500);

  // Standard entries: festival_lineup rows with festival_id set and stage_id null
  const { data: rawStandardRows, error: standardError } = await admin
    .from("festival_lineup")
    .select("id, artist_name, phase")
    .eq("festival_id", festivalId)
    .is("stage_id", null)
    .order("artist_name", { ascending: true });

  if (standardError)
    throw new ServiceError("Failed to fetch standard lineup", 500);

  const artistMap = await buildArtistMap(supabase);

  const mapArtistRow = (row) => {
    const found = artistMap.get(normalizeArtistName(row.artist_name));
    return {
      name: row.artist_name,
      day: row.artist_day || "",
      phase: row.phase || null,
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
      name: row.artist_name,
      phase: row.phase || null,
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
    success: true,
    lineup,
    standardArtists,
    lineupType,
    stages: (stagesWithLineup || []).map((s) => ({
      id: s.id,
      stage_name: s.stage_name,
      stage_order: s.stage_order,
    })),
  };
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

  return {
    success: true,
    message: "Lineup updated successfully",
    phase_applied: lineup_status,
  };
}
