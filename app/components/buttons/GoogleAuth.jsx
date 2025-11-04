"use client";
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { supabaseClient } from "@/app/lib/config/supabaseClient";

const GoogleAuth = () => {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    try {
      const base = typeof window !== 'undefined' ? window.location.origin : 'https://soundfolio.net';
      const redirectUrl = `${base}/auth/callback`;
      
      await supabaseClient.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false,
        },
      });
    } catch (error) {
      console.error("Google sign-in error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button className="flex gap-1 bg-stone-900  border border-gold font-bold hover:text-cream duration-300 px-2 items-center cursor-pointer" type="button" onClick={handleGoogleSignIn}>
      <FcGoogle size={20} />
      <span>Go With Google</span>
    </button>
  );
};

export default GoogleAuth;
