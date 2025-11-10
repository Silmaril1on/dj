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

    // Check if user's email is verified
    const { data: userData, error: userFetchError } = await supabase
      .from("users")
      .select("email_verified, submitted_festival_id")
      .eq("id", user.id)
      .single();

    if (userFetchError) {
      return NextResponse.json(
        { error: "Failed to verify user" },
        { status: 500 }
      );
    }

    // Check if user has already submitted a festival
    if (userData.submitted_festival_id) {
      return NextResponse.json(
        { error: "You have already submitted a festival" },
        { status: 400 }
      );
    }

    // Extract form data
    const name = formData.get("name");
    const description = formData.get("description");
    const bio = formData.get("bio");
    const poster = formData.get("poster");
    const start_date = formData.get("start_date");
    const end_date = formData.get("end_date");
    const location = formData.get("location");
    const capacity_total = formData.get("capacity_total");
    const capacity_per_day = formData.get("capacity_per_day");
    const country = formData.get("country");
    const city = formData.get("city");

    // Parse social_links array
    let social_links = [];
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
            ? firstEntry.split(",").filter(link => link.trim())
            : socialLinksEntries.filter(link => link && link.trim());
        }
      }
    } catch (error) {
      console.error("Error parsing social_links:", error);
      social_links = [];
    }

    // Validate required fields
    if (!name || !poster) {
      return NextResponse.json(
        { error: "Missing required fields: name, poster" },
        { status: 400 }
      );
    }

    // Validate social_links is array
    if (!Array.isArray(social_links)) {
      social_links = [];
    }

    // Validate poster file
    if (!poster || !poster.type) {
      return NextResponse.json(
        { error: "Please upload a valid poster image" },
        { status: 400 }
      );
    }

    if (!poster.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Poster must be an image file" },
        { status: 400 }
      );
    }

    // Validate poster file size (2MB limit for poster)
    if (poster.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Poster image size must be less than 2MB" },
        { status: 400 }
      );
    }

    // Validate dates if provided
    if (start_date && end_date) {
      const startDateObj = new Date(start_date);
      const endDateObj = new Date(end_date);
      
      if (endDateObj < startDateObj) {
        return NextResponse.json(
          { error: "End date must be after start date" },
          { status: 400 }
        );
      }
    }

    // Upload poster image
    const posterBuffer = Buffer.from(await poster.arrayBuffer());
    const posterFileName = `${user.id}-${Date.now()}-poster-${poster.name}`;
    const posterPath = `festivals/${posterFileName}`;

    const { error: posterUploadError } = await supabaseAdmin.storage
      .from("festival_images")
      .upload(posterPath, posterBuffer, {
        contentType: poster.type,
        upsert: false,
      });

    if (posterUploadError) {
      console.error("Poster upload error:", posterUploadError);
      return NextResponse.json(
        { error: "Failed to upload poster image" },
        { status: 500 }
      );
    }

    // Get poster public URL
    const { data: posterUrlData } = supabaseAdmin.storage
      .from("festival_images")
      .getPublicUrl(posterPath);
    const posterUrl = posterUrlData.publicUrl;

    // Insert festival into database
    const { data: festivalData, error: festivalError } = await supabase
      .from("festivals")
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        bio: bio?.trim() || null,
        poster: posterUrl,
        start_date: start_date || null,
        end_date: end_date || null,
        location: location?.trim() || null,
        capacity_total: capacity_total?.trim() || null,
        capacity_per_day: capacity_per_day?.trim() || null,
        country: country?.trim() || null,
        city: city?.trim() || null,
        user_id: user.id,
        social_links: social_links.length > 0 ? social_links : null,
        status: "pending",
      })
      .select()
      .single();

    if (festivalError) {
      console.error("Festival insert error:", festivalError);

      // Clean up uploaded image
      await supabaseAdmin.storage
        .from("festival_images")
        .remove([posterPath]);

      return NextResponse.json(
        { error: "Failed to submit festival" },
        { status: 500 }
      );
    }

    // Update user's submitted_festival_id
    const { error: updateUserError } = await supabase
      .from("users")
      .update({ submitted_festival_id: festivalData.id })
      .eq("id", user.id);

    if (updateUserError) {
      console.error("User update error:", updateUserError);
      // Don't fail the request, just log the error
    }

    return NextResponse.json(
      {
        success: true,
        message: "Festival submitted successfully! It will be reviewed by our team.",
        data: festivalData,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Unexpected error in POST /api/festivals/add-festival:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
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
    
    const festivalId = formData.get("festivalId");

    if (!festivalId) {
      return NextResponse.json(
        { error: "Festival ID is required for updates" },
        { status: 400 }
      );
    }

    // Verify festival ownership
    const { data: existingFestival, error: fetchError } = await supabase
      .from("festivals")
      .select("user_id, poster")
      .eq("id", festivalId)
      .single();

    if (fetchError || !existingFestival) {
      return NextResponse.json(
        { error: "Festival not found" },
        { status: 404 }
      );
    }

    if (existingFestival.user_id !== user.id) {
      return NextResponse.json(
        { error: "You do not have permission to edit this festival" },
        { status: 403 }
      );
    }

    // Extract form data
    const name = formData.get("name");
    const description = formData.get("description");
    const bio = formData.get("bio");
    const poster = formData.get("poster");
    const start_date = formData.get("start_date");
    const end_date = formData.get("end_date");
    const location = formData.get("location");
    const capacity_total = formData.get("capacity_total");
    const capacity_per_day = formData.get("capacity_per_day");
    const country = formData.get("country");
    const city = formData.get("city");

    // Parse social_links array
    let social_links = [];
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
            ? firstEntry.split(",").filter(link => link.trim())
            : socialLinksEntries.filter(link => link && link.trim());
        }
      }
    } catch (error) {
      console.error("Error parsing social_links:", error);
      social_links = [];
    }

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "Festival name is required" },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData = {
      name: name.trim(),
      description: description?.trim() || null,
      bio: bio?.trim() || null,
      start_date: start_date || null,
      end_date: end_date || null,
      location: location?.trim() || null,
      capacity_total: capacity_total?.trim() || null,
      capacity_per_day: capacity_per_day?.trim() || null,
      country: country?.trim() || null,
      city: city?.trim() || null,
      social_links: social_links.length > 0 ? social_links : null,
      updated_at: new Date().toISOString(),
    };

    // Handle poster image upload if provided
    if (poster && poster.size > 0) {
      if (!poster.type.startsWith("image/")) {
        return NextResponse.json(
          { error: "Poster must be an image file" },
          { status: 400 }
        );
      }

      if (poster.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Poster image size must be less than 5MB" },
          { status: 400 }
        );
      }

      // Upload new poster
      const posterBuffer = Buffer.from(await poster.arrayBuffer());
      const posterFileName = `${user.id}-${Date.now()}-poster-${poster.name}`;
      const posterPath = `festivals/${posterFileName}`;

      const { error: posterUploadError } = await supabaseAdmin.storage
        .from("festival_images")
        .upload(posterPath, posterBuffer, {
          contentType: poster.type,
          upsert: false,
        });

      if (posterUploadError) {
        console.error("Poster upload error:", posterUploadError);
        return NextResponse.json(
          { error: "Failed to upload poster image" },
          { status: 500 }
        );
      }

      const { data: posterUrlData } = supabaseAdmin.storage
        .from("festival_images")
        .getPublicUrl(posterPath);

      updateData.poster = posterUrlData.publicUrl;

      // Delete old poster if exists
      if (existingFestival.poster) {
        const oldPosterPath = existingFestival.poster.split('/festival_images/')[1];
        if (oldPosterPath) {
          await supabaseAdmin.storage
            .from("festival_images")
            .remove([oldPosterPath]);
        }
      }
    }

    // Validate dates if both provided
    if (updateData.start_date && updateData.end_date) {
      const startDateObj = new Date(updateData.start_date);
      const endDateObj = new Date(updateData.end_date);
      
      if (endDateObj < startDateObj) {
        return NextResponse.json(
          { error: "End date must be after start date" },
          { status: 400 }
        );
      }
    }

    // Update festival in database
    const { data: festivalData, error: updateError } = await supabase
      .from("festivals")
      .update(updateData)
      .eq("id", festivalId)
      .select()
      .single();

    if (updateError) {
      console.error("Festival update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update festival" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Festival updated successfully!",
        data: festivalData,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Unexpected error in PATCH /api/festivals/add-festival:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
