import { cookies } from "next/headers";
import {
  createSupabaseServerClient,
  supabaseAdmin,
} from "@/app/lib/config/supabaseServer";

/**
 * Server-side service: update an authenticated user's profile.
 * Handles avatar upload, auth display-name sync, and DB update.
 *
 * @param {string} userId - The authenticated user's ID
 * @param {FormData} formData - Raw FormData from the PUT request
 * @returns {{ profile: object|null, error: string|null }}
 */
export async function updateProfile(userId, formData) {
  try {
    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient(cookieStore);

    // --- Extract & sanitize fields ---
    const fields = [
      "userName",
      "first_name",
      "last_name",
      "birth_date",
      "sex",
      "address",
      "country",
      "city",
      "state",
      "zip_code",
    ];

    const updateData = {};
    for (const field of fields) {
      const value = formData.get(field);
      if (value && value.trim() !== "") {
        updateData[field] = value.trim();
      }
    }

    // --- Avatar upload ---
    const user_avatar = formData.get("user_avatar");
    if (user_avatar && user_avatar.size > 0) {
      // Remove old avatar if stored in our bucket
      const { data: currentUser } = await supabaseAdmin
        .from("users")
        .select("user_avatar")
        .eq("id", userId)
        .single();

      if (currentUser?.user_avatar?.includes("profile_images")) {
        const existingFileName = currentUser.user_avatar.split("/").pop();
        if (existingFileName) {
          await supabaseAdmin.storage
            .from("profile_images")
            .remove([existingFileName]);
        }
      }

      const fileExt = user_avatar.name.split(".").pop();
      const fileName = `${userId}.${fileExt}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from("profile_images")
        .upload(fileName, user_avatar, { cacheControl: "3600", upsert: true });

      if (uploadError) {
        return { profile: null, error: "Failed to upload avatar" };
      }

      const {
        data: { publicUrl },
      } = supabaseAdmin.storage.from("profile_images").getPublicUrl(fileName);

      updateData.user_avatar = publicUrl;
    }

    // --- Sync display_name in Supabase Auth ---
    if (updateData.userName) {
      const { error: authError } = await supabase.auth.updateUser({
        data: { display_name: updateData.userName },
      });
      if (authError) {
        return { profile: null, error: "Failed to update username in auth" };
      }
    }

    // --- Update users table (bypass RLS via admin) ---
    const { data: profile, error: dbError } = await supabaseAdmin
      .from("users")
      .update(updateData)
      .eq("id", userId)
      .select()
      .single();

    if (dbError) {
      return { profile: null, error: "Failed to update profile" };
    }

    return { profile, error: null };
  } catch (err) {
    console.error("[updateProfile] Unexpected error:", err);
    return { profile: null, error: "Internal server error" };
  }
}
