import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient, supabaseAdmin } from "@/app/lib/config/supabaseServer";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Artist ID is required" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);

    const { data: artist, error } = await supabase
      .from("artists")
      .select(
        `
        id,
        name,
        stage_name,
        country,
        city,
        sex,
        birth,
        desc,
        bio,
        genres,
        social_links,
        label,
        artist_image,
        status,
        created_at,
        updated_at
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching artist:", error);
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    if (!artist) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    return NextResponse.json(artist);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);


    if (!id) {
      return NextResponse.json(
        { error: "Artist ID is required" },
        { status: 400 }
      );
    }

    const contentType = request.headers.get("content-type");
    
    let type;

    // Handle FormData (for album with image)
    if (contentType && contentType.includes("multipart/form-data")) {
      console.log('Processing FormData request');
      const formData = await request.formData();
      type = formData.get("type");
      for (const [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value instanceof File ? `File: ${value.name}` : value);
      }
      
      if (type === "artist_album") {
        const name = formData.get("name");
        const release_date = formData.get("release_date");
        const description = formData.get("description");
        const tracklistJson = formData.get("tracklist");
        const album_image = formData.get("album_image");

        console.log('Album data:', { name, release_date, description, tracklistJson, hasImage: !!album_image });

        if (!name) {
          return NextResponse.json(
            { error: "Album name is required" },
            { status: 400 }
          );
        }

        let tracklist = [];
        if (tracklistJson) {
          try {
            tracklist = JSON.parse(tracklistJson);
          } catch (parseError) {
            return NextResponse.json(
              { error: "Invalid tracklist format" },
              { status: 400 }
            );
          }
        }

        let albumImageUrl = null;

        // Upload album image if provided
        if (album_image && album_image.size > 0) {
          console.log('Uploading album image...');
          const fileExt = album_image.name.split(".").pop();
          const fileName = `${id}_${Date.now()}.${fileExt}`;

          const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from("album_images")
            .upload(fileName, album_image, {
              cacheControl: "3600",
              upsert: false,
            });

          if (uploadError) {
            return NextResponse.json(
              { error: "Failed to upload album image", details: uploadError.message },
              { status: 500 }
            );
          }

          const {
            data: { publicUrl },
          } = supabaseAdmin.storage.from("album_images").getPublicUrl(fileName);

          albumImageUrl = publicUrl;
        }

        // Insert album into artist_albums table
        const albumData = {
          artist_id: id,
          name,
          release_date,
          description,
          tracklist,
          album_image: albumImageUrl,
        };

        const { data: album, error: albumError } = await supabaseAdmin
          .from("artist_albums")
          .insert(albumData)
          .select()
          .single();

        if (albumError) {
          return NextResponse.json(
            { error: "Failed to add album", details: albumError.message },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: "Album added successfully",
          data: album,
        });
      }
    } else {
      const body = await request.json();
      type = body.type;
      const { type: _, ...eventData } = body;

      // Check if this is an artist date addition request
      if (type === "artist_date") {
        // Add artist date to artist_schedule table
        const { data: artistDate, error: artistDateError } = await supabase
          .from("artist_schedule")
          .insert({
            artist_id: id,
            ...eventData,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (artistDateError) {
          console.error("Error adding artist date:", artistDateError);
          return NextResponse.json(
            { error: "Failed to add artist date", details: artistDateError.message },
            { status: 500 }
          );
        }
        return NextResponse.json({
          success: true,
          message: "Artist date added successfully",
          data: artistDate,
        });
      }
    }

    // For other update types, you can add logic here
    return NextResponse.json({ error: "Invalid update type" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
