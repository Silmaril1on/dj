"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { setUser } from "@/app/features/userSlice";
import { supabaseClient } from "@/app/lib/config/supabaseClient";
import MotionLogo from "@/app/components/ui/MotionLogo";

const AuthCallback = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  useEffect(() => {
    const handleGoogleProfile = async () => {
      // 1. Get the current session/user
      const {
        data: { user },
        error: userError,
      } = await supabaseClient.auth.getUser();
      console.log("Supabase Auth user:", user, "Error:", userError);

      if (!user) {
        router.replace("/signIn");
        return;
      }

      // 2. Check if user exists in users table
      const { data: existing, error: selectError } = await supabaseClient
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      console.log("Existing user in users table:", existing, "Error:", selectError);

      // 3. If not, insert user profile
      if (!existing) {
        const { email, user_metadata } = user;
        const { full_name, name, avatar_url, picture, userName, display_name } =
          user_metadata || {};
        const profile = {
          id: user.id,
          email,
          userName: userName || full_name || name || "",
          user_avatar: avatar_url || picture || "",
        };
        const { data: inserted, error: insertError } = await supabaseClient
          .from("users")
          .insert([profile])
          .select()
          .single();
        console.log("Inserted user profile:", inserted, "Error:", insertError);
      }

      // 4. Fetch the user profile from users table for Redux
      const { data: userProfile, error: fetchProfileError } = await supabaseClient
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      console.log("Fetched user profile for Redux:", userProfile, "Error:", fetchProfileError);

      if (userProfile) {
        dispatch(setUser(userProfile));
        // Send welcome notification if this is a new user (optional: check a flag)
        supabaseClient
          .from("notifications")
          .insert({
            user_id: userProfile.id,
            userName: userProfile.userName,
            email: userProfile.email,
            message:
              "Welcome to the platform. You can now login to your account and start using the platform.",
          })
          .then(({ error }) => {
            if (error) {
              console.warn("Failed to create welcome notification:", error);
            }
          });
      }

      // 5. Redirect to home or dashboard
      router.replace("/");
    };

    handleGoogleProfile();
  }, [router, dispatch]);

  return (
            <div className="h-screen center flex flex-col gap-5">
      <MotionLogo />
      <span>Signing you in...</span>
    </div>
  );
};

export default AuthCallback;