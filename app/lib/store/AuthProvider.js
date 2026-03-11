// components/AuthProvider.js
"use client";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createBrowserClient } from "@supabase/ssr";
import {
  setUser,
  setLoading,
  updateUserProfile,
  selectUser,
  selectIsAuthenticated,
} from "@/app/features/userSlice";

const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isDev = process.env.NODE_ENV !== "production";

  // Create Supabase client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      dispatch(setLoading(true));
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (isDev) {
        console.debug("[AuthProvider] initial session", {
          hasSession: !!session,
          hasUser: !!session?.user,
          error: error?.message || null,
        });
      }

      if (session?.user && !user) {
        // Fetch user profile
        const response = await fetch("/api/auth/profile");
        if (response.ok) {
          const data = await response.json();
          dispatch(setUser(data.profile));
        } else if (isDev) {
          console.debug("[AuthProvider] profile fetch failed", {
            status: response.status,
            statusText: response.statusText,
          });
        }
      } else if (!session && user) {
        // Clear user if no session
        dispatch(setUser(null));
      }

      dispatch(setLoading(false));
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      dispatch(setLoading(true));
      if (isDev) {
        console.debug("[AuthProvider] auth event", {
          event,
          hasSession: !!session,
          hasUser: !!session?.user,
        });
      }
      if (event === "SIGNED_IN" && session?.user) {
        // Fetch user profile
        const response = await fetch("/api/auth/profile");
        if (response.ok) {
          const data = await response.json();
          dispatch(setUser(data.profile));
        } else if (isDev) {
          console.debug("[AuthProvider] profile fetch failed", {
            status: response.status,
            statusText: response.statusText,
          });
        }
      } else if (event === "SIGNED_OUT") {
        dispatch(setUser(null));
      }
      dispatch(setLoading(false));
    });

    return () => subscription.unsubscribe();
  }, [dispatch, supabase.auth, user]);

  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = (event) => {
      if (event.type === "profile-updated" && event.detail?.profile) {
        dispatch(updateUserProfile(event.detail.profile));
      }
    };

    window.addEventListener("profile-updated", handleProfileUpdate);
    return () =>
      window.removeEventListener("profile-updated", handleProfileUpdate);
  }, [dispatch]);

  return children;
};

export default AuthProvider;
