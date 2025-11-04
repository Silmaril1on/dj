// api/auth/profile/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getServerUser,
  createSupabaseServerClient,
  supabaseAdmin,
} from "@/app/lib/config/supabaseServer";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const { user, error } = await getServerUser(cookieStore);

    if (error || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    return NextResponse.json({
      profile: user,
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const cookieStore = await cookies();
    const { user, error } = await getServerUser(cookieStore);

    if (error || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const formData = await request.formData();
    const supabase = await createSupabaseServerClient(cookieStore);

    // Extract form data and handle empty values
    const updateData = {};
    
    const userName = formData.get("userName");
    const first_name = formData.get("first_name");
    const last_name = formData.get("last_name");
    const birth_date = formData.get("birth_date");
    const sex = formData.get("sex");
    const address = formData.get("address");
    const country = formData.get("country");
    const city = formData.get("city");
    const state = formData.get("state");
    const zip_code = formData.get("zip_code");

    // Only add non-empty values to updateData
    if (userName) updateData.userName = userName;
    if (first_name) updateData.first_name = first_name;
    if (last_name) updateData.last_name = last_name;
    if (birth_date && birth_date.trim() !== "") updateData.birth_date = birth_date;
    if (sex && sex.trim() !== "") updateData.sex = sex;
    if (address) updateData.address = address;
    if (country) updateData.country = country;
    if (city) updateData.city = city;
    if (state) updateData.state = state;
    if (zip_code) updateData.zip_code = zip_code;

    // Handle file upload if present using supabaseAdmin
    const user_avatar = formData.get("user_avatar");
    if (user_avatar && user_avatar.size > 0) {
      // Get current user data to check for existing avatar using admin
      const { data: currentUser, error: fetchError } = await supabaseAdmin
        .from("users")
        .select("user_avatar")
        .eq("id", user.id)
        .single();

      if (fetchError) {
        console.error("Fetch user error:", fetchError);
        return NextResponse.json(
          { error: "Failed to fetch user data" },
          { status: 500 }
        );
      }

      // Delete existing avatar if it exists
      if (currentUser?.user_avatar) {
        try {
          // Extract filename from the existing URL
          const existingUrl = currentUser.user_avatar;
          const urlParts = existingUrl.split("/");
          const existingFileName = urlParts[urlParts.length - 1];

          // Only delete if it's actually a file in our bucket (not a default image URL)
          if (existingFileName && existingUrl.includes("profile_images")) {
            const { error: deleteError } = await supabaseAdmin.storage
              .from("profile_images")
              .remove([existingFileName]);

            if (deleteError) {
              console.warn("Failed to delete existing avatar:", deleteError);
              // Don't return error here, continue with upload
            }
          }
        } catch (deleteErr) {
          console.warn("Error processing existing avatar deletion:", deleteErr);
          // Continue with upload even if deletion fails
        }
      }

      // Upload new avatar with consistent filename using admin
      const fileExt = user_avatar.name.split(".").pop();
      const fileName = `${user.id}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from("profile_images")
        .upload(fileName, user_avatar, {
          cacheControl: "3600",
          upsert: true, // This will overwrite existing files with same name
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        return NextResponse.json(
          { error: "Failed to upload image" },
          { status: 500 }
        );
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabaseAdmin.storage.from("profile_images").getPublicUrl(fileName);

      updateData.user_avatar = publicUrl;
    }

    // Update userName in Supabase Auth (display name) if provided
    if (updateData.userName) {
      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: {
          display_name: updateData.userName,
        },
      });

      if (authUpdateError) {
        console.error("Auth update error:", authUpdateError);
        return NextResponse.json(
          { error: "Failed to update username in authentication" },
          { status: 500 }
        );
      }
    }

    // Update user profile using supabaseAdmin to bypass RLS
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from("users")
      .update(updateData)
      .eq("id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      profile: updatedUser,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
