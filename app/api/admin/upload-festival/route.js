import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerUser, supabaseAdmin } from "@/app/lib/config/supabaseServer";

export async function POST(request) {
  try {
    // Get the current user and check if admin
    const cookieStore = await cookies();
    const { user, error } = await getServerUser(cookieStore);

    if (error || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.is_admin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const formData = await request.formData();

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
            ? firstEntry.split(",").filter((link) => link.trim())
            : socialLinksEntries.filter((link) => link && link.trim());
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

    // Validate poster file size (5MB limit for admin uploads)
    if (poster.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Poster image size must be less than 5MB" },
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

    // Generate unique filename
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileExtension = poster.name.split(".").pop();
    const fileName = `festival_${Date.now()}_${randomId}.${fileExtension}`;

    // Upload poster image to Supabase storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("festival_images")
      .upload(`festivals/${fileName}`, poster, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Poster upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload poster image" },
        { status: 500 }
      );
    }

    // Get public URL for the uploaded poster
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage
      .from("festival_images")
      .getPublicUrl(`festivals/${fileName}`);

    // Filter out empty strings from arrays
    const filteredSocialLinks = social_links
      .filter((link) => link && typeof link === "string" && link.trim() !== "")
      .map((link) => link.trim());

    // Prepare festival data - NO user_id, status is 'approved' directly
    const festivalData = {
      name: name.trim(),
      description: description?.trim() || null,
      bio: bio?.trim() || null,
      poster: publicUrl,
      start_date: start_date || null,
      end_date: end_date || null,
      location: location?.trim() || null,
      capacity_total: capacity_total?.trim() || null,
      capacity_per_day: capacity_per_day?.trim() || null,
      country: country?.trim() || null,
      city: city?.trim() || null,
      social_links: filteredSocialLinks.length > 0 ? filteredSocialLinks : [],
      status: "approved", // Admin uploads are auto-approved
      // NO user_id field for admin uploads
    };

    // Insert festival into database
    const { data: newFestival, error: insertError } = await supabaseAdmin
      .from("festivals")
      .insert([festivalData])
      .select()
      .single();

    if (insertError) {
      console.error("Festival insert error:", insertError);

      // Clean up uploaded image
      await supabaseAdmin.storage
        .from("festival_images")
        .remove([`festivals/${fileName}`]);

      return NextResponse.json(
        { error: `Failed to create festival: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Festival uploaded successfully and approved",
      data: newFestival,
    });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
