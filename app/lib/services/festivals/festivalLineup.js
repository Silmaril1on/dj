import {
  ServiceError,
  getAuthenticatedContext,
  getSupabaseServerClient,
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
    .select("id, name, stage_name, artist_slug");

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

async function saveLineupStages(supabase, festivalId, stages, lineup_status) {
  for (let stageIndex = 0; stageIndex < stages.length; stageIndex++) {
    const stage = stages[stageIndex];

    const { data: insertedStage, error: stageError } = await supabase
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

    const { error: artistsError } = await supabase
      .from("festival_lineup")
      .insert(artistsToInsert);
    if (artistsError) throw new ServiceError("Failed to save lineup", 500);
  }

  await supabase
    .from("festivals")
    .update({ lineup_status: lineup_status || null })
    .eq("id", festivalId);
}

export async function getLineup(festivalId, cookieStore) {
  if (!festivalId) throw new ServiceError("Festival ID is required", 400);
  const supabase = await getSupabaseServerClient(cookieStore);

  const { data: stages, error: stagesError } = await supabase
    .from("festival_stages")
    .select(
      `
      id,
      stage_name,
      stage_order,
      festival_lineup (
        id,
        artist_name,
        artist_day,
        artist_order,
        phase
      )
    `,
    )
    .eq("festival_id", festivalId)
    .order("stage_order", { ascending: true });

  if (stagesError) throw new ServiceError("Failed to fetch lineup", 500);

  const artistMap = await buildArtistMap(supabase);

  const lineup = (stages || []).map((stage) => ({
    stage_name: stage.stage_name,
    artists: stage.festival_lineup
      .sort((a, b) => a.artist_order - b.artist_order)
      .map((artist) => {
        const found = artistMap.get(normalizeArtistName(artist.artist_name));
        return {
          name: artist.artist_name,
          day: artist.artist_day || "",
          phase: artist.phase || null,
          id: found?.id || null,
          artist_slug: found?.artist_slug || null,
        };
      }),
  }));

  return { success: true, lineup };
}

export async function createLineup(
  { festival_id, stages, lineup_status },
  cookieStore,
) {
  if (!festival_id || !stages || stages.length === 0) {
    throw new ServiceError("Festival ID and stages are required", 400);
  }

  const { user, supabase } = await getAuthenticatedContext(cookieStore);

  const { data: festival, error: festivalError } = await supabase
    .from("festivals")
    .select("user_id")
    .eq("id", festival_id)
    .single();

  if (festivalError || !festival || festival.user_id !== user.id) {
    throw new ServiceError("Unauthorized to modify this festival", 403);
  }

  await saveLineupStages(supabase, festival_id, stages, lineup_status);

  return {
    success: true,
    message: "Lineup created successfully",
    phase_applied: lineup_status,
  };
}

export async function updateLineup(
  { festival_id, stages, lineup_status },
  cookieStore,
) {
  if (!festival_id || !stages || stages.length === 0) {
    throw new ServiceError("Festival ID and stages are required", 400);
  }

  const { user, supabase } = await getAuthenticatedContext(cookieStore);

  const { data: festival, error: festivalError } = await supabase
    .from("festivals")
    .select("user_id")
    .eq("id", festival_id)
    .single();

  if (festivalError || !festival || festival.user_id !== user.id) {
    throw new ServiceError("Unauthorized to modify this festival", 403);
  }

  const { error: deleteError } = await supabase
    .from("festival_stages")
    .delete()
    .eq("festival_id", festival_id);
  if (deleteError) throw new ServiceError("Failed to update lineup", 500);

  await saveLineupStages(supabase, festival_id, stages, lineup_status);

  return {
    success: true,
    message: "Lineup updated successfully",
    phase_applied: lineup_status,
  };
}
