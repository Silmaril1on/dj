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
    const country = formData.get("country");
    const city = formData.get("city");
    const capacity = formData.get("capacity");
    const description = formData.get("description");
    const club_image = formData.get("club_image");

    // Parse array fields safely - Get ALL entries for array fields
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
            ? firstEntry.split(",")
            : socialLinksEntries;
        }
      }
    } catch (error) {
      social_links = [];
    }

    // Validate required fields
    if (
      !name ||
      !country ||
      !city ||
      !capacity ||
      !description ||
      !club_image
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: name, country, city, capacity, description, club_image",
        },
        { status: 400 }
      );
    }

    // Validate social_links is array
    if (!Array.isArray(social_links)) {
      social_links = [];
    }

    // Validate file type
    if (!club_image.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Please upload a valid image file" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = club_image.name.split(".").pop();
    const fileName = `${name
      .toLowerCase()
      .replace(/\s+/g, "")}_${Date.now()}.${fileExtension}`;

    // Upload image to Supabase storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("club_images")
      .upload(fileName, club_image, {
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
    } = supabaseAdmin.storage.from("club_images").getPublicUrl(fileName);

    // Filter out empty strings from arrays and trim whitespace
    const filteredSocialLinks = social_links
      .filter((link) => link && typeof link === "string" && link.trim() !== "")
      .map((link) => link.trim());

    // Prepare club data with status: pending
    const clubData = {
      user_id: user.id,
      name,
      country,
      city,
      capacity,
      description,
      social_links: filteredSocialLinks.length > 0 ? filteredSocialLinks : [],
      rating_stats: {},
      status: "pending",
      club_image: publicUrl,
    };

    // Insert club into database
    const { data: newClub, error: insertError } = await supabaseAdmin
      .from("clubs")
      .insert([clubData])
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: `Failed to create club: ${insertError.message}` },
        { status: 500 }
      );
    }

    // Update user's submitted_club_id
    const { error: userUpdateError } = await supabase
      .from("users")
      .update({ submitted_club_id: newClub.id })
      .eq("id", user.id);

    if (userUpdateError) {
      console.error("Error updating user:", userUpdateError);
      // Don't fail the request if user update fails, just log it
    }

    return NextResponse.json({
      success: true,
      message: "Club submitted successfully and is pending approval",
      data: newClub,
    });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
