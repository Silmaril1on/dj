import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient, getServerUser } from "@/app/lib/config/supabaseServer";

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
        { status: 400 }
      );
    }

    // Fetch stages with their artists
    const { data: stages, error: stagesError } = await supabase
      .from("festival_stages")
      .select(`
        id,
        stage_name,
        stage_order,
        festival_lineup (
          id,
          artist_name,
          artist_order
        )
      `)
      .eq("festival_id", festivalId)
      .order("stage_order", { ascending: true });

    if (stagesError) {
      console.error("Error fetching stages:", stagesError);
      return NextResponse.json(
        { error: "Failed to fetch lineup" },
        { status: 500 }
      );
    }

    // Transform data to match form structure
    const lineup = stages.map(stage => ({
      stage_name: stage.stage_name,
      artists: stage.festival_lineup
        .sort((a, b) => a.artist_order - b.artist_order)
        .map(artist => artist.artist_name)
    }));

    return NextResponse.json({ success: true, lineup });
  } catch (err) {
    console.error("Unexpected error in GET /api/festivals/add-festival-lineup:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
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
        { status: 401 }
      );
    }

    const supabase = await createSupabaseServerClient(cookieStore);
    const { festival_id, festival_name, stages } = await request.json();

    if (!festival_id || !stages || stages.length === 0) {
      return NextResponse.json(
        { error: "Festival ID and stages are required" },
        { status: 400 }
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
        { status: 403 }
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
          { status: 500 }
        );
      }

      // Insert artists for this stage
      const artistsToInsert = stage.artists.map((artistName, artistIndex) => ({
        stage_id: insertedStage.id,
        artist_name: artistName,
        artist_order: artistIndex,
      }));

      const { error: artistsError } = await supabase
        .from("festival_lineup")
        .insert(artistsToInsert);

      if (artistsError) {
        console.error("Error inserting artists:", artistsError);
        return NextResponse.json(
          { error: "Failed to create lineup" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Lineup created successfully",
    });
  } catch (err) {
    console.error("Unexpected error in POST /api/festivals/add-festival-lineup:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
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
        { status: 401 }
      );
    }

    const supabase = await createSupabaseServerClient(cookieStore);
    const { festival_id, festival_name, stages } = await request.json();

    if (!festival_id || !stages || stages.length === 0) {
      return NextResponse.json(
        { error: "Festival ID and stages are required" },
        { status: 400 }
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
        { status: 403 }
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
        { status: 500 }
      );
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
          { status: 500 }
        );
      }

      const artistsToInsert = stage.artists.map((artistName, artistIndex) => ({
        stage_id: insertedStage.id,
        artist_name: artistName,
        artist_order: artistIndex,
      }));

      const { error: artistsError } = await supabase
        .from("festival_lineup")
        .insert(artistsToInsert);

      if (artistsError) {
        console.error("Error inserting artists:", artistsError);
        return NextResponse.json(
          { error: "Failed to update lineup" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Lineup updated successfully",
    });
  } catch (err) {
    console.error("Unexpected error in PATCH /api/festivals/add-festival-lineup:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
