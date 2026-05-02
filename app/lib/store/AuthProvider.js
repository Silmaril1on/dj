// components/AuthProvider.js
"use client";
import { useEffect, useMemo, useRef } from "react";
import { useDispatch } from "react-redux";
import { createBrowserClient } from "@supabase/ssr";
import {
  setUser,
  setLoading,
  updateUserProfile,
} from "@/app/features/userSlice";

const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  // Guard against React 18 Strict Mode double-invocation and state-triggered re-runs
  const hasFetched = useRef(false);

  // Supabase browser client — created ONCE for the lifetime of the app.
  // Creating it on every render would open a new WebSocket per render.
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      ),
    [],
  );

  useEffect(() => {
    const fetchProfile = async () => {
      const response = await fetch("/api/auth/profile");
      if (response.ok) {
        const data = await response.json();
        dispatch(setUser(data.profile));
      }
    };

    const getInitialSession = async () => {
      if (hasFetched.current) return;
      hasFetched.current = true;

      dispatch(setLoading(true));
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) await fetchProfile();
      } finally {
        dispatch(setLoading(false));
      }
    };

    getInitialSession();

    // Subscribe to auth state changes (sign-in, sign-out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      dispatch(setLoading(true));
      try {
        if (event === "SIGNED_IN" && session?.user) {
          await fetchProfile();
        } else if (event === "SIGNED_OUT") {
          dispatch(setUser(null));
        }
        // TOKEN_REFRESHED / USER_UPDATED — session stays valid, no re-fetch needed
      } finally {
        dispatch(setLoading(false));
      }
    });

    return () => subscription.unsubscribe();
  }, [dispatch, supabase]); // supabase is stable (useMemo []), dispatch is stable from Redux

  // Listen for profile updates dispatched by other parts of the app
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
