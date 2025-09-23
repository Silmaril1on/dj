import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/app/lib/config/supabaseServer";

export async function GET(request) {
  try {
    // Get today's date
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();
    const currentYear = today.getFullYear();

    // Create supabase client with error handling
    let supabase;
    try {
      const cookieStore = await cookies();
      supabase = await createSupabaseServerClient(cookieStore);

      // Verify supabase client was created successfully
      if (!supabase) {
        throw new Error("Failed to create Supabase client");
      }
    } catch (clientError) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      );
    }

    // Query all approved artists with birth dates
    const { data: artists, error } = await supabase
      .from("artists")
      .select("id, name, stage_name, artist_image, birth")
      .eq("status", "approved")
      .not("birth", "is", null);

    if (error) {
      console.error("Supabase query error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter artists born today using JavaScript
    const artistsBornToday =
      artists?.filter((artist) => {
        // Check if birth field exists and is not null/undefined
        if (
          !artist.birth ||
          artist.birth === null ||
          artist.birth === undefined
        ) {
          return false;
        }

        try {
          const birthDate = new Date(artist.birth);

          // Check if the date is valid
          if (isNaN(birthDate.getTime())) {
            console.warn(
              `Invalid birth date for artist ${artist.id}: ${artist.birth}`
            );
            return false;
          }

          const birthMonth = birthDate.getMonth() + 1;
          const birthDay = birthDate.getDate();

          return birthMonth === currentMonth && birthDay === currentDay;
        } catch (error) {
          return false;
        }
      }) || [];

    // Calculate ages and format data
    const artistsWithAge = artistsBornToday.map((artist) => {
      try {
        const birthYear = new Date(artist.birth).getFullYear();
        const age = currentYear - birthYear;

        return {
          id: artist.id,
          name: artist.name,
          stage_name: artist.stage_name,
          artist_image: artist.artist_image,
          age: age,
        };
      } catch (error) {
        return {
          id: artist.id,
          name: artist.name,
          stage_name: artist.stage_name,
          artist_image: artist.artist_image,
          age: 0, // Default age if calculation fails
        };
      }
    });

    return NextResponse.json({
      success: true,
      data: artistsWithAge,
      count: artistsWithAge.length,
    });
  } catch (error) {
    console.error("Error fetching artists born today:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
