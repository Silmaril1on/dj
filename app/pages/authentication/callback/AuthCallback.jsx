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
        const waitForUser = async (retries = 10, delay = 300) => {
          for (let i = 0; i < retries; i++) {
            const { data, error } = await supabaseClient.auth.getUser();
            if (data?.user) {
              return { user: data.user };
            }
            await new Promise((r) => setTimeout(r, delay));
          }
          return { user: null };
        };

        const { user } = await waitForUser();
        if (!user) {
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
          router.replace("/sign-in");
          return;
        }

        const { user: userProfile, isNewUser } = await response.json();
        if (userProfile) {
          dispatch(setUser(userProfile));
        }
        router.replace("/");
      } catch (error) {
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