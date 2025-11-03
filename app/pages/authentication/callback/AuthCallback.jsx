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
      try {
        console.log("🔄 Auth callback started");
        console.log("Current URL:", window.location.href);
        
        // 1. Verify user is authenticated
        const {
          data: { user },
          error: userError,
        } = await supabaseClient.auth.getUser();
        
        console.log("✅ Supabase Auth user:", user, "Error:", userError);

        if (!user) {
          console.error("No user found, redirecting to sign in");
          router.replace("/sign-in");
          return;
        }

        // 2. Call API to handle user profile creation/retrieval
        const response = await fetch("/api/auth/google-callback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Failed to create/fetch user profile:", errorData);
          router.replace("/sign-in");
          return;
        }

        const { user: userProfile, isNewUser } = await response.json();
        console.log("User profile:", userProfile, "Is new user:", isNewUser);

        // 3. Set user in Redux store
        if (userProfile) {
          dispatch(setUser(userProfile));
        }

        // 4. Redirect to home
        router.replace("/");
      } catch (error) {
        console.error("Google callback error:", error);
        router.replace("/sign-in");
      }
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