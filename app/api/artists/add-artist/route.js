import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getServerUser,
  createSupabaseServerClient,
  supabaseAdmin,
} from "@/app/lib/config/supabaseServer";

export async function POST(request) {
  try {
    // Get the current user
    const cookieStore = await cookies();
    const { user, error } = await getServerUser(cookieStore);
    if (error || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const supabase = await createSupabaseServerClient(cookieStore);

    // Extract form data
    const name = formData.get("name");
    const artist_image = formData.get("artist_image");
    const stage_name = formData.get("stage_name");
    const sex = formData.get("sex");
    const desc = formData.get("desc");
    const country = formData.get("country");
    const city = formData.get("city");
    const bio = formData.get("bio");
    const birth = formData.get("birth");

    // Parse array fields safely - Get ALL entries for array fields
    let genres = [];
    let social_links = [];
    let label = [];

    try {
      // Get all entries for genres (FormData can have multiple entries with same key)
      const genresEntries = formData.getAll("genres");
      const genresJsonString = genresEntries.find((entry) => {
        if (typeof entry === "string") {
          try {
            JSON.parse(entry);
            return true;
          } catch {
            return false;
          }
        }
        return false;
      });

      if (genresJsonString) {
        genres = JSON.parse(genresJsonString);
      } else if (genresEntries.length > 0) {
        // Fallback: if no JSON found, treat as comma-separated or individual entries
        const firstEntry = genresEntries[0];
        if (typeof firstEntry === "string") {
          genres = firstEntry.includes(",")
            ? firstEntry.split(",")
            : genresEntries;
        }
      }
    } catch (error) {
      genres = [];
    }

    try {
      const socialLinksEntries = formData.getAll("social_links");
      const socialLinksJsonString = socialLinksEntries.find((entry) => {
        if (typeof entry === "string") {
          try {
            JSON.parse(entry);
            return true;
          } catch {
            return false;
          }
        }
        return false;
      });

      if (socialLinksJsonString) {
        social_links = JSON.parse(socialLinksJsonString);
      } else if (socialLinksEntries.length > 0) {
        const firstEntry = socialLinksEntries[0];
        if (typeof firstEntry === "string") {
          social_links = firstEntry.includes(",")
            ? firstEntry.split(",")
            : socialLinksEntries;
        }
      }
    } catch (error) {
      social_links = [];
    }

    try {
      const labelEntries = formData.getAll("label");
      const labelJsonString = labelEntries.find((entry) => {
        if (typeof entry === "string") {
          try {
            JSON.parse(entry);
            return true;
          } catch {
            return false;
          }
        }
        return false;
      });

      if (labelJsonString) {
        label = JSON.parse(labelJsonString);
      } else if (labelEntries.length > 0) {
        const firstEntry = labelEntries[0];
        if (typeof firstEntry === "string") {
          label = firstEntry.includes(",")
            ? firstEntry.split(",")
            : labelEntries;
        }
      }
    } catch (error) {
      label = [];
    }

    // Validate required fields
    if (!name || !artist_image || !desc || !country) {
      return NextResponse.json(
        { error: "Missing required fields: name, artist_image, desc, country" },
        { status: 400 }
      );
    }

    // Validate genres, social_links, and label are arrays
    if (!Array.isArray(genres)) {
      genres = [];
    }
    if (!Array.isArray(social_links)) {
      social_links = [];
    }
    if (!Array.isArray(label)) {
      label = [];
    }

    // Validate file type
    if (!artist_image.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Please upload a valid image file" },
        { status: 400 }
      );
    }

    // Validate file size (1MB limit)
    if (artist_image.size > 1 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image size must be less than 1MB" },
        { status: 400 }
      );
    }

    // Generate unique filename with random ID to avoid title issues
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileExtension = artist_image.name.split(".").pop();
    const fileName = `artist_${Date.now()}_${randomId}.${fileExtension}`;

    // Upload image to Supabase storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("artist_profile_images")
      .upload(fileName, artist_image, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: "Failed to upload image" },
        { status: 500 }
      );
    }

    // Get public URL for the uploaded image
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage
      .from("artist_profile_images")
      .getPublicUrl(fileName);

    // Filter out empty strings from arrays and trim whitespace
    const filteredGenres = genres
      .filter(
        (genre) => genre && typeof genre === "string" && genre.trim() !== ""
      )
      .map((genre) => genre.trim());

    const filteredSocialLinks = social_links
      .filter((link) => link && typeof link === "string" && link.trim() !== "")
      .map((link) => link.trim());

    const filteredLabels = label
      .filter(
        (labelItem) =>
          labelItem && typeof labelItem === "string" && labelItem.trim() !== ""
      )
      .map((labelItem) => labelItem.trim());

    // Prepare artist data with status: pending and submitter user_id
    const artistData = {
      name,
      artist_image: publicUrl,
      stage_name: stage_name || null,
      sex: sex || null,
      desc,
      country,
      city: city || null,
      label: filteredLabels.length > 0 ? filteredLabels : [],
      bio: bio || null,
      birth: birth || null,
      genres: filteredGenres.length > 0 ? filteredGenres : [],
      social_links: filteredSocialLinks.length > 0 ? filteredSocialLinks : [],
      status: "pending",
      user_id: user.id, 
    };

    // Insert artist into database
    const { data: newArtist, error: insertError } = await supabaseAdmin
      .from("artists")
      .insert([artistData])
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: `Failed to create artist: ${insertError.message}` },
        { status: 500 }
      );
    }

    // Update user's submitted_artist_id
    const { error: userUpdateError } = await supabase
      .from("users")
      .update({ submitted_artist_id: newArtist.id })
      .eq("id", user.id);

    if (userUpdateError) {
      console.error("Error updating user:", userUpdateError);
      // Don't fail the request if user update fails, just log it
    }

    // Create notification for the user
    try {
      const notificationData = {
        user_id: user.id,
        title: "Your DJ Profile Has Been Submitted",
        message: `Thank you for submitting your DJ profile "${stage_name || name}". Our team will review your submission and notify you once it's approved. You can view and edit your submission in your profile dashboard.`,
        type: "submit",
        read: false,
        created_at: new Date().toISOString()
      };

      const { error: notificationError } = await supabaseAdmin
        .from("notifications")
        .insert(notificationData);

      if (notificationError) {
        console.error("Error creating notification:", notificationError);
        // Don't fail the whole request if notification fails
      }
    } catch (notificationError) {
      console.error("Failed to create notification:", notificationError);
      // Continue with the response even if notification fails
    }

    return NextResponse.json({
      success: true,
      message: "Artist submitted successfully and is pending approval",
      data: newArtist,
    });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


