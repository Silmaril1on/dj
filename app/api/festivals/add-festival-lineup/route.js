import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createSupabaseServerClient,
  getServerUser,
} from "@/app/lib/config/supabaseServer";

// Helper function to normalize artist names for matching
const normalizeArtistName = (name) => {
  if (!name) return "";
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ");
};

// GET - Fetch existing lineup for a festival
export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);

    const { searchParams } = new URL(request.url);
    const festivalId = searchParams.get("festival_id");

    if (!festivalId) {
      return NextResponse.json(
        { error: "Festival ID is required" },
        { status: 400 },
      );
    }

    // Fetch stages with their artists
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

    if (stagesError) {
      console.error("Error fetching stages:", stagesError);
      return NextResponse.json(
        { error: "Failed to fetch lineup" },
        { status: 500 },
      );
    }

    // Fetch all artists from database for slug matching
    const { data: allArtistsData } = await supabase
      .from("artists")
      .select("id, name, stage_name, artist_slug");

    // Create a map for quick lookup (normalized name -> artist)
    const artistMap = new Map();
    if (allArtistsData) {
      allArtistsData.forEach((artist) => {
        const normalizedName = normalizeArtistName(artist.name);
        const normalizedStageName = normalizeArtistName(artist.stage_name);

        if (normalizedName) artistMap.set(normalizedName, artist);
        if (normalizedStageName) artistMap.set(normalizedStageName, artist);
      });
    }

    // Transform data to match form structure with artist slugs
    const lineup = stages.map((stage) => ({
      stage_name: stage.stage_name,
      artists: stage.festival_lineup
        .sort((a, b) => a.artist_order - b.artist_order)
        .map((artist) => {
          const normalizedSearchName = normalizeArtistName(artist.artist_name);
          const foundArtist = artistMap.get(normalizedSearchName);

          const baseArtist = {
            name: artist.artist_name,
            day: artist.artist_day || "",
            phase: artist.phase || null,
          };

          return foundArtist
            ? {
                ...baseArtist,
                id: foundArtist.id,
                artist_slug: foundArtist.artist_slug,
              }
            : {
                ...baseArtist,
                id: null,
                artist_slug: null,
              };
        }),
    }));

    return NextResponse.json({ success: true, lineup });
  } catch (err) {
    console.error(
      "Unexpected error in GET /api/festivals/add-festival-lineup:",
      err,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST - Create new lineup
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const { user, error: userError } = await getServerUser(cookieStore);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const supabase = await createSupabaseServerClient(cookieStore);
    const { festival_id, festival_name, stages, lineup_status } =
      await request.json();

    // Debug logging
    console.log("POST lineup - Received data:", {
      festival_id,
      lineup_status,
      stage_count: stages?.length,
      first_stage_sample: stages?.[0]?.artists
        ?.slice(0, 2)
        .map((a) => ({ name: a.name, phase: a.phase })),
    });

    if (!festival_id || !stages || stages.length === 0) {
      return NextResponse.json(
        { error: "Festival ID and stages are required" },
        { status: 400 },
      );
    }

    // Verify user owns this festival
    const { data: festival, error: festivalError } = await supabase
      .from("festivals")
      .select("user_id")
      .eq("id", festival_id)
      .single();

    if (festivalError || !festival || festival.user_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized to modify this festival" },
        { status: 403 },
      );
    }

    // Insert stages and artists in a transaction-like manner
    for (let stageIndex = 0; stageIndex < stages.length; stageIndex++) {
      const stage = stages[stageIndex];

      // Insert stage
      const { data: insertedStage, error: stageError } = await supabase
        .from("festival_stages")
        .insert({
          festival_id: festival_id,
          stage_name: stage.stage_name,
          stage_order: stageIndex,
        })
        .select()
        .single();

      if (stageError) {
        console.error("Error inserting stage:", stageError);
        return NextResponse.json(
          { error: "Failed to create stage" },
          { status: 500 },
        );
      }

      // Insert artists for this stage with phase
      const artistsToInsert = stage.artists.map((artist, artistIndex) => ({
        stage_id: insertedStage.id,
        artist_name: artist.name,
        artist_day: artist.day || null,
        artist_order: artistIndex,
        phase: artist.phase || lineup_status || null,
      }));

      // Debug: Log what we're inserting
      console.log(
        `Inserting ${artistsToInsert.length} artists with phases:`,
        artistsToInsert.map((a) => ({ name: a.artist_name, phase: a.phase })),
      );

      const { error: artistsError } = await supabase
        .from("festival_lineup")
        .insert(artistsToInsert);

      if (artistsError) {
        console.error("Error inserting artists:", artistsError);
        return NextResponse.json(
          { error: "Failed to create lineup" },
          { status: 500 },
        );
      }
    }

    // Always update lineup_status in festivals table (even if null)
    console.log(
      `POST - Updating festivals.lineup_status to: "${lineup_status || null}"`,
    );
    const { error: updateStatusError } = await supabase
      .from("festivals")
      .update({ lineup_status: lineup_status || null })
      .eq("id", festival_id);

    if (updateStatusError) {
      console.error("Error updating lineup status:", updateStatusError);
    } else {
      console.log("✓ festivals.lineup_status updated successfully");
    }

    return NextResponse.json({
      success: true,
      message: "Lineup created successfully",
      phase_applied: lineup_status,
    });
  } catch (err) {
    console.error(
      "Unexpected error in POST /api/festivals/add-festival-lineup:",
      err,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH - Update existing lineup
export async function PATCH(request) {
  try {
    const cookieStore = await cookies();
    const { user, error: userError } = await getServerUser(cookieStore);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const supabase = await createSupabaseServerClient(cookieStore);
    const { festival_id, festival_name, stages, lineup_status } =
      await request.json();

    // Debug logging
    console.log("PATCH lineup - Received data:", {
      festival_id,
      lineup_status,
      stage_count: stages?.length,
      first_stage_sample: stages?.[0]?.artists
        ?.slice(0, 2)
        .map((a) => ({ name: a.name, phase: a.phase })),
    });

    if (!festival_id || !stages || stages.length === 0) {
      return NextResponse.json(
        { error: "Festival ID and stages are required" },
        { status: 400 },
      );
    }

    // Verify user owns this festival
    const { data: festival, error: festivalError } = await supabase
      .from("festivals")
      .select("user_id")
      .eq("id", festival_id)
      .single();

    if (festivalError || !festival || festival.user_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized to modify this festival" },
        { status: 403 },
      );
    }

    // Delete all existing stages (and artists will be deleted via cascade)
    const { error: deleteStagesError } = await supabase
      .from("festival_stages")
      .delete()
      .eq("festival_id", festival_id);

    if (deleteStagesError) {
      console.error("Error deleting stages:", deleteStagesError);
      return NextResponse.json(
        { error: "Failed to update lineup" },
        { status: 500 },
      );
    }

    // Always update lineup_status in festivals table (even if null)
    console.log(
      `PATCH - Updating festivals.lineup_status to: "${lineup_status || null}"`,
    );
    const { error: updateStatusError } = await supabase
      .from("festivals")
      .update({ lineup_status: lineup_status || null })
      .eq("id", festival_id);

    if (updateStatusError) {
      console.error("Error updating lineup status:", updateStatusError);
    } else {
      console.log("✓ festivals.lineup_status updated successfully");
    }

    // Insert new stages and artists (same logic as POST)
    for (let stageIndex = 0; stageIndex < stages.length; stageIndex++) {
      const stage = stages[stageIndex];

      const { data: insertedStage, error: stageError } = await supabase
        .from("festival_stages")
        .insert({
          festival_id: festival_id,
          stage_name: stage.stage_name,
          stage_order: stageIndex,
        })
        .select()
        .single();

      if (stageError) {
        console.error("Error inserting stage:", stageError);
        return NextResponse.json(
          { error: "Failed to update stage" },
          { status: 500 },
        );
      }

      const artistsToInsert = stage.artists.map((artist, artistIndex) => ({
        stage_id: insertedStage.id,
        artist_name: artist.name,
        artist_day: artist.day || null,
        artist_order: artistIndex,
        phase: artist.phase || lineup_status || null,
      }));

      // Debug: Log what we're inserting in PATCH
      console.log(
        `PATCH - Inserting ${artistsToInsert.length} artists with phases:`,
        artistsToInsert.map((a) => ({ name: a.artist_name, phase: a.phase })),
      );

      const { error: artistsError } = await supabase
        .from("festival_lineup")
        .insert(artistsToInsert);

      if (artistsError) {
        console.error("Error inserting artists:", artistsError);
        return NextResponse.json(
          { error: "Failed to update lineup" },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Lineup updated successfully",
      phase_applied: lineup_status,
    });
  } catch (err) {
    console.error(
      "Unexpected error in PATCH /api/festivals/add-festival-lineup:",
      err,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
