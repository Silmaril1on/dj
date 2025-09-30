import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getServerUser,
  createSupabaseServerClient,
  supabaseAdmin,
} from "@/app/lib/config/supabaseServer";

export async function POST(request) {
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

    const name = formData.get("name");
    const country = formData.get("country");
    const city = formData.get("city");
    const capacity = formData.get("capacity");
    const description = formData.get("description");
    const club_image = formData.get("club_image");
    const address = formData.get("address");
    let residents = [];
    let social_links = [];

    // Handle social_links parsing
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

    // Handle residents parsing (same logic as social_links)
    try {
      const residentsEntries = formData.getAll("residents");
      const residentsJsonString = residentsEntries.find((entry) => {
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

      if (residentsJsonString) {
        residents = JSON.parse(residentsJsonString);
      } else if (residentsEntries.length > 0) {
        const firstEntry = residentsEntries[0];
        if (typeof firstEntry === "string") {
          residents = firstEntry.includes(",")
            ? firstEntry.split(",")
            : residentsEntries;
        }
      }
    } catch (error) {
      residents = [];
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

    // Validate arrays
    if (!Array.isArray(social_links)) {
      social_links = [];
    }
    if (!Array.isArray(residents)) {
      residents = [];
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

    const filteredResidents = residents
      .filter((res) => res && typeof res === "string" && res.trim() !== "")
      .map((r) => r.trim());

    // Prepare club data with status: pending
    const clubData = {
      user_id: user.id,
      name,
      country,
      city,
      capacity,
      description,
      social_links: filteredSocialLinks.length > 0 ? filteredSocialLinks : [],
      residents: filteredResidents.length > 0 ? filteredResidents : [],
      status: "pending",
      club_image: publicUrl,
      address,
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

    const clubId = formData.get("clubId");
    if (!clubId) {
      return NextResponse.json({ error: "Missing clubId" }, { status: 400 });
    }

    // Fetch the existing club
    const { data: existingClub, error: fetchError } = await supabaseAdmin
      .from("clubs")
      .select("*")
      .eq("id", clubId)
      .single();

    if (fetchError || !existingClub) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    // Only allow the owner to edit
    if (existingClub.user_id !== user.id) {
      return NextResponse.json(
        { error: "You are not allowed to edit this club" },
        { status: 403 }
      );
    }

    // Prepare update fields
    const name = formData.get("name");
    const country = formData.get("country");
    const city = formData.get("city");
    const capacity = formData.get("capacity");
    const description = formData.get("description");
    const address = formData.get("address");
    let club_image = formData.get("club_image");
    let residents = [];
    let social_links = [];

    // Handle social_links parsing
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

    // Handle residents parsing (same logic as social_links)
    try {
      const residentsEntries = formData.getAll("residents");
      const residentsJsonString = residentsEntries.find((entry) => {
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

      if (residentsJsonString) {
        residents = JSON.parse(residentsJsonString);
      } else if (residentsEntries.length > 0) {
        const firstEntry = residentsEntries[0];
        if (typeof firstEntry === "string") {
          residents = firstEntry.includes(",")
            ? firstEntry.split(",")
            : residentsEntries;
        }
      }
    } catch (error) {
      residents = [];
    }

    // Validate and filter arrays
    const filteredResidents = Array.isArray(residents)
      ? residents
          .filter((r) => r && typeof r === "string" && r.trim() !== "")
          .map((r) => r.trim())
      : [];
    const filteredSocialLinks = Array.isArray(social_links)
      ? social_links
          .filter(
            (link) => link && typeof link === "string" && link.trim() !== ""
          )
          .map((link) => link.trim())
      : [];

    // Handle club_image update (if a new file is uploaded)
    let publicUrl = existingClub.club_image;
    if (club_image && typeof club_image !== "string" && club_image.name) {
      // Validate file type
      if (!club_image.type.startsWith("image/")) {
        return NextResponse.json(
          { error: "Please upload a valid image file" },
          { status: 400 }
        );
      }
      const fileExtension = club_image.name.split(".").pop();
      const fileName = `${name
        .toLowerCase()
        .replace(/\s+/g, "")}_${Date.now()}.${fileExtension}`;

      const { data: uploadData, error: uploadError } =
        await supabaseAdmin.storage
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

      const {
        data: { publicUrl: uploadedUrl },
      } = supabaseAdmin.storage.from("club_images").getPublicUrl(fileName);

      publicUrl = uploadedUrl;
    }

    // Prepare update object
    const updateData = {
      name,
      country,
      city,
      capacity,
      description,
      address,
      residents: filteredResidents,
      social_links: filteredSocialLinks,
      club_image: publicUrl,
      updated_at: new Date().toISOString(),
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    // Update the club
    const { data: updatedClub, error: updateError } = await supabaseAdmin
      .from("clubs")
      .update(updateData)
      .eq("id", clubId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to update club: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Club updated successfully",
      data: updatedClub,
    });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
